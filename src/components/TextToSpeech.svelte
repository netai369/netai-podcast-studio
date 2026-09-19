<script lang="ts">
  import { settingsStore } from '@/stores';
  import { generatePodcastAudio, fetchAvailableVoices, generateVoicePreviewAudio, deleteVoice } from '@/services/ttsServices';
  import { VOICES_BY_LANGUAGE } from '@/constants';
  import { createWavBlob, resampleLinear, floatToInt16, playBase64Audio, PeakAccumulator } from '@/utils/audio';
  import Spinner from '@/components/Spinner.svelte';
  import Waveform from '@/components/Waveform.svelte';

  let text = '';
  let language = 'de';
  let voice = 'nova';
  let audioUrl = '';
  let error = '';
  let generating = false;
  let cloning = false;
  let cloneError = '';
  let uploadedVoices: { id: string; label: string }[] = [];
  let voiceFile: File | null = null;
  let recording = false;
  let recordedBlob: Blob | null = null;
  let recordedUrl: string | null = null;
  let recordStream: MediaStream | null = null;
  let recordContext: AudioContext | null = null;
  let recordSource: MediaStreamAudioSourceNode | null = null;
  let recordProcessor: ScriptProcessorNode | null = null;
  let recordSink: GainNode | null = null;
  let pcmChunks: Float32Array[] = [];
  let peakAccumulator = new PeakAccumulator();
  let livePeaks: Float32Array = new Float32Array(0);
  let waveformRaf = 0;
  let recordSeconds = 0;
  let recordStartedAt = 0;
  let recordAudio: HTMLAudioElement | null = null;
  let recordProgress = 0;
  let generatedAudio: HTMLAudioElement | null = null;
  let generatedProgress = 0;
  let previewing = false;
  let deleting = false;

  $: languageVoices = (VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE['en']).map(v => ({
    id: v.name,
    label: v.label
  }));

  $: allVoices = [...languageVoices, ...uploadedVoices];

  async function loadVoices() {
    try {
      const voices = await fetchAvailableVoices($settingsStore);
      uploadedVoices = voices
        .filter(v => v.id.startsWith('cloned_'))
        .map(v => ({ id: v.id, label: v.label }));
    } catch {
      // ignore
    }
  }

  $: if ($settingsStore) loadVoices();

  function handleVoiceFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    voiceFile = input.files && input.files[0] ? input.files[0] : null;
  }

  async function handleCloneVoice() {
    if (!voiceFile) {
      cloneError = 'Select a WAV file first.';
      return;
    }
    cloning = true;
    cloneError = '';
    try {
      const form = new FormData();
      form.append('file', voiceFile);
      form.append('language', language);
      const baseUrl = ($settingsStore.tts.openAudioUrl || 'http://localhost:8800').replace(/\/v1\/audio\/speech$/, '');
      const resp = await fetch(`${baseUrl}/v1/voices/upload?language=${encodeURIComponent(language)}`, {
        method: 'POST',
        body: form,
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Upload failed: ${resp.status} ${txt}`);
      }
      const data = await resp.json();
      uploadedVoices = [...uploadedVoices, { id: data.voice_id, label: data.label }];
      voice = data.voice_id;
      voiceFile = null;
    } catch (e) {
      cloneError = e instanceof Error ? e.message : 'Voice cloning failed.';
    } finally {
      cloning = false;
    }
  }

  async function handlePreviewVoice() {
    if (!voice) return;
    previewing = true;
    try {
      const audioB64 = await generateVoicePreviewAudio(voice, $settingsStore, language);
      await playBase64Audio(audioB64);
    } catch (e) {
      cloneError = e instanceof Error ? e.message : 'Preview failed.';
    } finally {
      previewing = false;
    }
  }

  async function handleDeleteVoice() {
    if (!voice.startsWith('cloned_')) return;
    if (!confirm('Delete this cloned voice?')) return;
    deleting = true;
    cloneError = '';
    try {
      await deleteVoice($settingsStore, voice);
      uploadedVoices = uploadedVoices.filter(v => v.id !== voice);
      voice = 'nova';
    } catch (e) {
      cloneError = e instanceof Error ? e.message : 'Delete failed.';
    } finally {
      deleting = false;
    }
  }

  const TARGET_SAMPLE_RATE = 24000;

  // Live view shows a scrolling ~6 s window (fixed time scale) instead of a
  // tiny per-frame window, so it reads as a stable waveform, not a flicker.
  const LIVE_WINDOW_PAIRS = 600;

  function startWaveformLoop() {
    recordStartedAt = Date.now();
    const tick = () => {
      const all = peakAccumulator.snapshot();
      const max = LIVE_WINDOW_PAIRS * 2;
      livePeaks = all.length > max ? all.slice(all.length - max) : all;
      recordSeconds = (Date.now() - recordStartedAt) / 1000;
      waveformRaf = requestAnimationFrame(tick);
    };
    tick();
  }

  function stopWaveformLoop() {
    if (waveformRaf) cancelAnimationFrame(waveformRaf);
    waveformRaf = 0;
  }

  function handleRecordSeek(fraction: number) {
    if (!recordAudio || !isFinite(recordAudio.duration)) return;
    recordAudio.currentTime = fraction * recordAudio.duration;
    recordProgress = fraction;
  }

  function handleRecordTimeUpdate() {
    if (!recordAudio || !recordAudio.duration) return;
    recordProgress = recordAudio.currentTime / recordAudio.duration;
  }

  function handleGeneratedSeek(fraction: number) {
    if (!generatedAudio || !isFinite(generatedAudio.duration)) return;
    generatedAudio.currentTime = fraction * generatedAudio.duration;
    generatedProgress = fraction;
  }

  function handleGeneratedTimeUpdate() {
    if (!generatedAudio || !generatedAudio.duration) return;
    generatedProgress = generatedAudio.currentTime / generatedAudio.duration;
  }

  async function startRecording() {
    cloneError = '';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      recordStream = stream;

      // Capture raw PCM instead of routing through MediaRecorder (WebM/Opus).
      // The codec is lossy and its default bitrate audibly degrades the voice
      // reference; raw samples give the TTS engine a clean 24 kHz mono signal.
      const context = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: TARGET_SAMPLE_RATE });
      recordContext = context;

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const sink = context.createGain();
      sink.gain.value = 0;

      pcmChunks = [];
      peakAccumulator = new PeakAccumulator();
      livePeaks = new Float32Array(0);
      recordSeconds = 0;

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const copy = new Float32Array(input);
        pcmChunks.push(copy);
        peakAccumulator.push(copy);
      };

      source.connect(processor);
      processor.connect(sink);
      sink.connect(context.destination);

      recordSource = source;
      recordProcessor = processor;
      recordSink = sink;

      if (context.state === 'suspended') await context.resume();

      recording = true;
      recordedBlob = null;
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      recordedUrl = null;
      voiceFile = null;
      startWaveformLoop();
    } catch (e: any) {
      teardownRecordingGraph();
      const name = e?.name || e?.constructor?.name || 'Error';
      const message = e?.message || 'Microphone access denied.';
      cloneError = `Microphone error (${name}): ${message}. If the browser did not prompt, check the site permission in browser settings and allow microphone access for this URL.`;
    }
  }

  function teardownRecordingGraph() {
    stopWaveformLoop();
    if (recordProcessor) recordProcessor.onaudioprocess = null;
    try { recordSource?.disconnect(); } catch { /* already detached */ }
    try { recordProcessor?.disconnect(); } catch { /* already detached */ }
    try { recordSink?.disconnect(); } catch { /* already detached */ }
    recordStream?.getTracks().forEach(track => track.stop());
    const context = recordContext;
    if (context && context.state !== 'closed') context.close().catch(() => {});
    recordSource = null;
    recordProcessor = null;
    recordSink = null;
    recordStream = null;
    recordContext = null;
  }

  function stopRecording() {
    if (!recording) return;
    recording = false;
    const captureRate = recordContext?.sampleRate || TARGET_SAMPLE_RATE;
    const chunks = pcmChunks;
    pcmChunks = [];
    teardownRecordingGraph();
    finalizeRecording(chunks, captureRate);
  }

  function finalizeRecording(chunks: Float32Array[], captureRate: number) {
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    if (total === 0) {
      cloneError = 'No audio was captured. Please try again.';
      return;
    }
    const merged = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    const normalized = resampleLinear(merged, captureRate, TARGET_SAMPLE_RATE);
    const wavBlob = createWavBlob(floatToInt16(normalized), TARGET_SAMPLE_RATE, 1);
    recordedBlob = wavBlob;
    recordedUrl = URL.createObjectURL(wavBlob);
    voiceFile = new File([wavBlob], 'recorded_voice.wav', { type: 'audio/wav' });
    recordProgress = 0;
    livePeaks = new Float32Array(0);
  }

  function discardRecording() {
    recordedBlob = null;
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    recordedUrl = null;
    recordProgress = 0;
    voiceFile = null;
  }

  async function generate() {
    error = '';
    audioUrl = '';
    generatedProgress = 0;
    if (!text.trim()) {
      error = 'Enter text to synthesize.';
      return;
    }
    generating = true;
    try {
      const speakers = [{ name: 'Speaker', voice }];
      audioUrl = await generatePodcastAudio(text, 'solo', speakers, 'professional', $settingsStore, () => {}, language);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Speech generation failed.';
    } finally {
      generating = false;
    }
  }
</script>

<section class="bg-slate-800 rounded-lg shadow-lg p-6">
  <h2 class="text-xl font-bold mb-2 text-slate-100">Quick Text to Speech</h2>
  <p class="text-sm text-slate-400 mb-4">Generate speech directly through the configured NetAI TTS endpoint.</p>
  <textarea bind:value={text} rows="5" placeholder="Enter text to synthesize..." class="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100"></textarea>
  <div class="grid grid-cols-2 gap-3 mt-3">
    <select bind:value={language} class="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100">
      <option value="de">German</option><option value="en">English</option><option value="fr">French</option><option value="it">Italian</option>
    </select>
    <select bind:value={voice} class="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-slate-100">
      {#each allVoices as item}<option value={item.id}>{item.label}</option>{/each}
    </select>
  </div>

  <div class="mt-2 flex gap-2 items-center">
    <button on:click={handlePreviewVoice} disabled={previewing || deleting || !voice} class="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded-md text-sm font-medium">
      {#if previewing}<Spinner />{:else}Preview{/if}
    </button>
    {#if voice.startsWith('cloned_')}
      <button on:click={handleDeleteVoice} disabled={previewing || deleting} class="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-md text-sm font-medium">
        {#if deleting}<Spinner />{:else}Delete{/if}
      </button>
    {/if}
  </div>

  <div class="mt-3 p-3 bg-slate-700/50 rounded-md">
    <p class="text-xs text-slate-400 mb-2">Voice cloning: upload or record a reference WAV (mono, 24 kHz recommended).</p>
    <div class="flex gap-2 items-center">
      <input type="file" accept="audio/wav" on:change={handleVoiceFileChange} class="block text-sm text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700" />
      <button on:click={handleCloneVoice} disabled={cloning || !voiceFile} class="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded-md text-sm font-medium">
        {#if cloning}<Spinner />{:else}Clone{/if}
      </button>
    </div>
    <div class="flex gap-2 items-center mt-2">
      {#if recording}
        <button on:click={stopRecording} class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">Stop Recording</button>
      {:else}
        <button on:click={startRecording} class="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-md text-sm font-medium">Record</button>
      {/if}
      {#if recordedBlob}
        <button on:click={discardRecording} class="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium">Discard</button>
      {/if}
    </div>
    <div class="mt-2">
      {#if recording}
        <Waveform peaks={livePeaks} progress={1} label="Live recording waveform" />
        <p class="mt-1 text-xs text-slate-400">Live waveform · {recordSeconds.toFixed(1)}s</p>
      {:else if recordedUrl}
        <Waveform
          src={recordedUrl}
          progress={recordProgress}
          label="Recording waveform"
          on:seek={(e) => handleRecordSeek(e.detail)}
        />
        <audio bind:this={recordAudio} src={recordedUrl} on:timeupdate={handleRecordTimeUpdate} controls class="mt-2 w-full"></audio>
        <p class="mt-1 text-xs text-slate-400">Recording overview — click the waveform to seek.</p>
      {/if}
    </div>
    {#if cloneError}<p class="mt-2 text-sm text-red-400">{cloneError}</p>{/if}
  </div>

  <button on:click={generate} disabled={generating} class="mt-4 w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium">
    {#if generating}<Spinner />{:else}Generate Speech{/if}
  </button>
  {#if error}<p class="mt-3 text-sm text-red-400">{error}</p>{/if}
  {#if audioUrl}
    <div class="mt-4">
      <Waveform
        src={audioUrl}
        progress={generatedProgress}
        label="Generated speech waveform"
        on:seek={(e) => handleGeneratedSeek(e.detail)}
      />
      <audio bind:this={generatedAudio} src={audioUrl} on:timeupdate={handleGeneratedTimeUpdate} controls autoplay class="mt-2 w-full"></audio>
      <p class="mt-1 text-xs text-slate-400">Generated audio — click the waveform to seek.</p>
    </div>
  {/if}
</section>
