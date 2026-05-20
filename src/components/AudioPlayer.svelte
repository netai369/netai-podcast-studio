<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import type { Podcast } from '@/types';
  import { i18n } from '@/stores';
  import { createMp3UrlFromPcmBytes } from '@/utils/audio';

  import Icon from '@/components/Icons.svelte';
  import Spinner from '@/components/Spinner.svelte';

  export let podcast: Podcast;

  const dispatch = createEventDispatcher();
  
  let audio: HTMLAudioElement;
  let canvas: HTMLCanvasElement;
  let audioContext: AudioContext;
  let audioBuffer: AudioBuffer;

  let isPlaying = false;
  let currentTime = 0;
  let duration = 0;
  let isConvertingMp3 = false;
  let mp3Url: string | null = null;
  let isLoadingWaveform = true;

  onMount(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch('close');
    };
    window.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    loadAndDrawWaveform();

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
      if (audioContext) audioContext.close();
    };
  });

  async function loadAndDrawWaveform() {
    try {
      console.log("DEBUG: Loading waveform for URL:", podcast.audioUrl);
      console.log("DEBUG: Audio URL type:", typeof podcast.audioUrl);
      console.log("DEBUG: Audio URL protocol:", podcast.audioUrl.startsWith('blob:') ? 'blob' : 'other');
      
      // Try to decode the audio data first
      const response = await fetch(podcast.audioUrl);
      console.log("DEBUG: Fetch response status:", response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log("DEBUG: Array buffer size:", arrayBuffer.byteLength);
      
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("DEBUG: Audio decoded successfully, sample rate:", audioBuffer.sampleRate, "length:", audioBuffer.length);
        console.log("DEBUG: About to call drawWaveform");
        drawWaveform();
        console.log("DEBUG: drawWaveform called");
      } catch (decodeError) {
        console.log("DEBUG: Failed to decode audio, creating placeholder waveform:", decodeError);
        // Create a simple placeholder waveform if decoding fails
        audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
        drawPlaceholderWaveform();
      }
      isLoadingWaveform = false;
    } catch (err) {
      console.error("Failed to load or draw waveform:", err);
      // Fallback: create placeholder waveform
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
        drawPlaceholderWaveform();
      } catch (fallbackErr) {
        console.error("Fallback waveform failed:", fallbackErr);
      }
      isLoadingWaveform = false;
    }
  }

  function drawWaveform(progress = 0) {
    if (!canvas || !audioBuffer) {
      console.log("DEBUG: Cannot draw waveform - missing canvas or audioBuffer");
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log("DEBUG: Cannot draw waveform - no canvas context");
      return;
    }

    const data = audioBuffer.getChannelData(0);
    console.log("DEBUG: Drawing waveform with data length:", data.length, "progress:", progress);
    
    const { width, height } = canvas;
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const progressX = Math.floor(width * progress);

    // Draw played part
    ctx.strokeStyle = '#38BDF8'; // lightBlue-400
    ctx.beginPath();
    for (let i = 0; i < progressX; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.moveTo(i, amp * (1 + min));
        ctx.lineTo(i, amp * (1 + max));
    }
    ctx.stroke();

    // Draw unplayed part
    ctx.strokeStyle = '#4A5568'; // slate-600
    ctx.beginPath();
    for (let i = progressX; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.moveTo(i, amp * (1 + min));
        ctx.lineTo(i, amp * (1 + max));
    }
    ctx.stroke();
    
    console.log("DEBUG: Waveform drawing completed");
  }

  function drawPlaceholderWaveform(progress = 0) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const progressX = Math.floor(width * progress);

    // Draw a simple sine wave pattern as placeholder
    const waveHeight = height * 0.3;

    // Draw played part
    ctx.strokeStyle = '#38BDF8'; // lightBlue-400
    ctx.beginPath();
    for (let i = 0; i < progressX; i++) {
        const y = amp + Math.sin(i * 0.1) * waveHeight;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
    }
    ctx.stroke();

    // Draw unplayed part
    ctx.strokeStyle = '#4A5568'; // slate-600
    ctx.beginPath();
    for (let i = progressX; i < width; i++) {
        const y = amp + Math.sin(i * 0.1) * waveHeight;
        if (i === progressX) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
    }
    ctx.stroke();
  }
  
  function handleTimeUpdate() {
    if (!audio) return;
    currentTime = audio.currentTime;
    duration = audio.duration;
    drawWaveform(currentTime / duration);
  }

  function handleSeek(e: MouseEvent) {
    if (!duration || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = duration * percent;
  }
  
  function handleDownloadScript() {
    const blob = new Blob([podcast.script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${podcast.title.replace(/ /g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadMp3() {
    if (mp3Url) {
      const a = document.createElement('a');
      a.href = mp3Url;
      a.download = `${podcast.title.replace(/ /g, '_')}.mp3`;
      a.click();
      return;
    }

    isConvertingMp3 = true;
    try {
      const blob = await fetch(podcast.audioUrl).then(r => r.blob());
      const arrayBuffer = await blob.arrayBuffer();
      const pcmBytes = new Uint8Array(arrayBuffer.slice(44)); // Strip WAV header
      const url = await createMp3UrlFromPcmBytes(pcmBytes);
      mp3Url = url;

      const a = document.createElement('a');
      a.href = url;
      a.download = `${podcast.title.replace(/ /g, '_')}.mp3`;
      a.click();
    } catch (error) {
      console.error("Failed to convert to MP3", error);
    } finally {
      isConvertingMp3 = false;
    }
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
</script>

<div 
  class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
  on:click|self={() => dispatch('close')}
>
  <div class="bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg m-4 p-6 border border-slate-700 relative">
    <button 
      on:click={() => dispatch('close')}
      class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full"
      aria-label={$i18n.t('player.closeAria')}
    >
      <Icon name="x" className="h-6 w-6" />
    </button>

    <h2 class="text-2xl font-bold text-slate-100 mb-2">{podcast.title}</h2>
    <div class="text-slate-400 mb-6 max-h-40 overflow-y-auto">
      <p class="whitespace-pre-wrap">{podcast.script}</p>
    </div>
    
    <div class="relative bg-slate-700/50 rounded-md h-24 w-full flex items-center justify-center mb-4 cursor-pointer" on:click={handleSeek}>
      {#if isLoadingWaveform}
        <Spinner />
      {/if}
      <canvas bind:this={canvas} width="500" height="96" class="w-full h-full" />
    </div>

    <audio
      bind:this={audio}
      src={podcast.audioUrl}
      on:timeupdate={handleTimeUpdate}
      on:loadedmetadata={() => {
        console.log("DEBUG: Audio loaded metadata, duration:", audio.duration);
        duration = audio.duration;
      }}
      on:play={() => {
        console.log("DEBUG: Audio playing");
        isPlaying = true;
      }}
      on:pause={() => {
        console.log("DEBUG: Audio paused");
        isPlaying = false;
      }}
      on:error={(e) => {
        console.error("DEBUG: Audio error:", e);
        console.error("DEBUG: Audio src:", podcast.audioUrl);
        console.error("DEBUG: Audio error target:", e.target);
      }}
      controls
      class="w-full mb-4"
    ></audio>

    <div class="flex items-center justify-between text-slate-400">
        <button on:click={() => audio.play()} class:hidden={isPlaying}><Icon name="playCircle" className="h-8 w-8 text-blue-400"/></button>
        <button on:click={() => audio.pause()} class:hidden={!isPlaying}><Icon name="pauseCircle" className="h-8 w-8 text-blue-400"/></button>
        <div class="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration || 0)}</div>
    </div>

    <div class="mt-6 flex flex-wrap gap-4 justify-between items-center">
      <span class="text-sm text-slate-500">
        {$i18n.t('player.duration', { duration: String(podcast.duration) })} &bull; {podcast.createdAt.toLocaleDateString()}
      </span>
      <div class="flex gap-2">
        <button on:click={handleDownloadScript} class="inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">
          <Icon name="download" className="h-4 w-4 mr-2" /> {$i18n.t('player.downloadScript')}
        </button>
        <a href={podcast.audioUrl} download={`${podcast.title.replace(/ /g, '_')}.wav`} class="inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">
          <Icon name="download" className="h-4 w-4 mr-2" /> {$i18n.t('player.downloadAudio')}
        </a>
        <button on:click={handleDownloadMp3} disabled={isConvertingMp3} class="inline-flex items-center px-3 py-2 border border-slate-600 text-sm font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-wait">
          {#if isConvertingMp3}<Spinner />{:else}<Icon name="download" className="h-4 w-4 mr-2" />{/if}
          {$i18n.t('player.downloadAudioMp3')}
        </button>
      </div>
    </div>
  </div>
</div>
