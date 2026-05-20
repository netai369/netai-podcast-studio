<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { writable, get } from 'svelte/store';
  import type { Document, Podcast, PodcastStyle, SpeakerConfig, PodcastNarrationStyle, Language } from '@/types';
  import { settingsStore, i18n } from '@/stores';
  import { generatePodcastScriptStream, generatePodcastMetadata, generatePodcastAudio, generateVoicePreviewAudio, fetchAvailableVoices } from '@/services/api';
  import { PODCAST_DURATIONS, PODCAST_STYLES, PODCAST_NARRATION_STYLES, LANGUAGES, VOICES_BY_LANGUAGE, getInitialSpeakers, getLanguageName, DEFAULT_NAMES_BY_LANGUAGE } from '@/constants';
  import { playBase64Audio } from '@/utils/audio';

  import Icon from '@/components/Icons.svelte';
  import Spinner from '@/components/Spinner.svelte';
  import ProgressBar from '@/components/ProgressBar.svelte';
  import ScriptEditor from '@/components/ScriptEditor.svelte';

  export let documents: Document[];
  export let podcastToEdit: Podcast | null = null;

  const dispatch = createEventDispatcher();

  let state: 'config' | 'generating_script' | 'editing' | 'generating_audio' = 'config';
  let topic = '';
  let duration: number = 1;
  let customDuration: number = 2;
  let style: PodcastStyle = 'solo';
  let narrationStyle: PodcastNarrationStyle = 'professional';
  let language: Language = 'de'; // Default to German like the UI
  let speakers: SpeakerConfig[] = getInitialSpeakers(language);
  let draft: { title: string, description: string, script: string } | null = null;
  let progressMessage = '';
  let audioProgress = 0;
  let streamingScript = '';
  let availableVoices: { id: string; name: string; gender: 'M' | 'F'; label: string }[] = (VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE['en']).map(voice => ({
    ...voice,
    id: voice.name.toLowerCase().replace(/\s+/g, '_')
  }));
  let loadingVoices = false;
  let isEditingExistingPodcast = false;
  let currentPodcastId: string | null = null;

  // Helper function for persistent storage
  function createPersistentStore<T>(key: string, startValue: T) {
    const isBrowser = typeof window !== 'undefined';
    const storedValue = isBrowser ? localStorage.getItem(key) : null;
    const store = writable<T>(storedValue ? JSON.parse(storedValue) : startValue);

    store.subscribe(val => {
      if (isBrowser) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    });

    return store;
  }

  // Persistent store for last used settings
  const lastSettingsStore = createPersistentStore('podcast_studio_lastSettings', {
    duration: 1,
    style: 'solo' as PodcastStyle,
    narrationStyle: 'professional' as PodcastNarrationStyle,
    language: 'de' as Language
  });

  // Load last settings on mount
  onMount(async () => {
    console.log('DEBUG: Component mounted, loading settings...');
    
    // Load available voices first
    console.log('DEBUG: Calling loadAvailableVoices from onMount...');
    await loadAvailableVoices();
    console.log('DEBUG: Available voices after initial load:', availableVoices);
    
    // Only load settings if we are NOT editing (though onMount runs once, so this is mostly for initial state)
    // We use get() to read the value once without subscribing to avoid loops when editing
    if (!podcastToEdit) {
      const settings: any = get(lastSettingsStore);
      if (settings) {
        console.log('DEBUG: Loading last used settings:', settings);
        duration = settings.duration;
        style = settings.style;
        narrationStyle = settings.narrationStyle;
        language = settings.language;
        speakers = getInitialSpeakersFromAvailableVoices(language);
        loadAvailableVoices();
      }
    }
  });

  // Save settings when they change
  $: if (duration && style && narrationStyle && language) {
    lastSettingsStore.set({ duration, style, narrationStyle, language });
  }
  
  // Reactive statement to handle podcast editing when podcastToEdit changes
  $: if (podcastToEdit) {
    // Only initialize if it's a DIFFERENT podcast than what we are currently working on
    // This prevents re-initialization loops that lock the editor
    if (podcastToEdit.id !== currentPodcastId) {
      console.log('DEBUG: podcastToEdit changed, setting up editing mode for', podcastToEdit.id);
      currentPodcastId = podcastToEdit.id;
      isEditingExistingPodcast = true;
      
      topic = podcastToEdit.topic;
      style = podcastToEdit.style;
      narrationStyle = podcastToEdit.narrationStyle;
      language = podcastToEdit.language;
      speakers = JSON.parse(JSON.stringify(podcastToEdit.speakers)); // Deep copy

      const isPresetDuration = PODCAST_DURATIONS.includes(podcastToEdit.duration);
      if (isPresetDuration) {
        duration = podcastToEdit.duration;
      } else {
        duration = 0; // Represents "Custom"
        customDuration = podcastToEdit.duration;
      }

      draft = {
        title: podcastToEdit.title,
        description: podcastToEdit.description,
        script: podcastToEdit.script,
      };
      state = 'editing';
      // Load voices after state change to ensure proper initialization
      setTimeout(() => loadAvailableVoices(), 200);
    }
  } else if (isEditingExistingPodcast && state === 'editing') {
    // Reset to config when editing an existing podcast is cancelled
    console.log('DEBUG: Editing cancelled, resetting to config');
    state = 'config';
    isEditingExistingPodcast = false;
    currentPodcastId = null;
  }

  // Only reset to config if we were editing an existing podcast and it's now null
  // Don't reset if we just generated a new script

  async function loadAvailableVoices() {
    try {
      loadingVoices = true;
      console.log('DEBUG: Loading available voices with config:', $settingsStore);
      console.log('DEBUG: TTS provider:', $settingsStore.tts?.provider);
      console.log('DEBUG: TTS URL:', $settingsStore.tts?.openAudioUrl);
      
      if (!$settingsStore.tts?.openAudioUrl) {
        console.warn('DEBUG: No TTS URL configured, using hardcoded voices');
        availableVoices = (VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE['en']).map(voice => ({
          ...voice,
          id: voice.name
        }));
        return;
      }
      
      const fetchedVoices = await fetchAvailableVoices($settingsStore);
      
      if (fetchedVoices.length > 0) {
        availableVoices = fetchedVoices;
      } else {
        // Fallback to hardcoded voices if backend returns empty list (e.g. Gemini)
        console.log('DEBUG: No voices fetched, using hardcoded fallback for language:', language);
        availableVoices = (VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE['en']).map(voice => ({
          ...voice,
          id: voice.name
        }));
      }
      
      console.log('DEBUG: Loaded available voices:', availableVoices);
    } catch (error) {
      console.error('Failed to load available voices:', error);
      // Fallback to hardcoded voices if backend fails
      availableVoices = (VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE['en']).map(voice => ({
        ...voice,
        id: voice.name
      }));
    } finally {
      loadingVoices = false;
    }
  }

  function getInitialSpeakersFromAvailableVoices(language: string): SpeakerConfig[] {
    // Use available voices if loaded, otherwise fallback to hardcoded voices
    const voices = availableVoices.length > 0 ? availableVoices : (VOICES_BY_LANGUAGE[language] || VOICES_BY_LANGUAGE['en']).map(voice => ({
      ...voice,
      id: voice.name
    }));
    const names = DEFAULT_NAMES_BY_LANGUAGE[language];

    const speaker1Voice = voices.find(v => v.gender === 'F') || voices[0];
    const speaker2Voice = voices.find(v => v.gender === 'M') || voices[voices.length - 1];
    
    return [
      { name: names?.F[0] || 'Speaker 1', voice: speaker1Voice?.id || voices[0]?.id || 'puck' },
      { name: names?.M[0] || 'Speaker 2', voice: speaker2Voice?.id || voices[voices.length - 1]?.id || 'puck' },
    ];
  }

  function handleLanguageChange() {
    speakers = getInitialSpeakersFromAvailableVoices(language);
    loadAvailableVoices();
  }

  function handleStyleChange() {
    if (['documentary', 'educational', 'professional', 'storytelling'].includes(narrationStyle) && style !== 'solo') {
      style = 'solo';
    } else if (['conversational', 'explainer'].includes(narrationStyle) && style !== 'conversation') {
      style = 'conversation';
    }
    loadAvailableVoices();
  }

  async function handleGenerateScript() {
    if (documents.length === 0) {
      alert("Please upload at least one document.");
      return;
    }
    console.log('DEBUG: Starting script generation with params:', {
      documentsCount: documents.length,
      topic,
      duration: duration === 0 ? customDuration : duration,
      style,
      speakers,
      language,
      narrationStyle,
      settings: $settingsStore
    });
    state = 'generating_script';
    progressMessage = $i18n.t('progress.generatingScript');
    let script = '';

    try {
      console.log('DEBUG: Calling generatePodcastScriptStream');
      streamingScript = '';
      const stream = generatePodcastScriptStream(documents, topic, duration === 0 ? customDuration : duration, style, speakers, language, narrationStyle, $settingsStore);
      for await (const chunk of stream) {
        script += chunk;
        streamingScript = script;
        draft = { title: '', description: '', script: script };
      }
      console.log('DEBUG: Script generation completed, script length:', script.length);

      // Remove thinking tags from the complete script - keep only content after </think>
      const thinkEndIndex = script.indexOf('</think>');
      if (thinkEndIndex !== -1) {
        script = script.substring(thinkEndIndex + 8).trim(); // Keep only content after </think>
        console.log('DEBUG: Removed thinking content from complete script, keeping only content after </think>');
        if (draft) draft.script = script;
      }

      const languageName = getLanguageName(language);
      console.log('DEBUG: Calling generatePodcastMetadata with language:', languageName);
      const metadata = await generatePodcastMetadata(script, $settingsStore, languageName);
      console.log('DEBUG: Metadata generated:', metadata);
      draft = { title: metadata.title, description: metadata.description, script: script };
      console.log('DEBUG: Setting state to editing, draft:', draft);
      await tick();
      state = 'editing';
      console.log('DEBUG: Script generation process completed successfully, current state:', state);
    } catch (e) {
      console.error("Script generation failed", e);
      alert(`${$i18n.t('errors.scriptGeneration')}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      state = 'config';
    } finally {
      progressMessage = '';
    }
  }

  async function handleSynthesizeAudio() {
    if (!draft) return;
    state = 'generating_audio';
    progressMessage = $i18n.t('progress.generatingAudio');
    audioProgress = 0;

    try {
      const audioB64 = await generatePodcastAudio(
        draft.script,
        style,
        speakers,
        narrationStyle,
        $settingsStore,
        (p) => audioProgress = p,
        language
      );
      
      const newPodcast: Podcast = {
        id: podcastToEdit?.id || `pod_${Date.now()}`,
        title: draft.title,
        description: draft.description,
        script: draft.script,
        audioUrl: audioB64, // audioB64 ist bereits die Blob-URL
        createdAt: new Date(),
        topic,
        duration: duration === 0 ? customDuration : duration,
        style,
        narrationStyle,
        speakers,
        language
      };

      dispatch('podcastCreated', newPodcast);
      resetForm();
    } catch (e) {
      console.error("Audio synthesis failed", e);
      alert(`${$i18n.t('errors.audioSynthesis')}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      state = 'editing'; // Go back to editor on failure
    } finally {
      progressMessage = '';
      streamingScript = '';
    }
  }

  let previewingVoice: string | boolean | null = null;
  async function handlePreviewVoice(voice: string) {
    if (previewingVoice === voice) return;
    previewingVoice = voice;
    try {
      const audioB64 = await generateVoicePreviewAudio(voice, $settingsStore, language);
      await playBase64Audio(audioB64);
    } catch (e) {
      console.error("Failed to play voice preview", e);
      alert($i18n.t('errors.audioPreview'));
    } finally {
      previewingVoice = null;
    }
  }

  function resetForm() {
    state = 'config';
    topic = '';
    duration = 1;
    style = 'solo';
    narrationStyle = 'professional';
    language = 'de';
    speakers = getInitialSpeakersFromAvailableVoices(language);
    draft = null;
    isEditingExistingPodcast = false;
    currentPodcastId = null;
    dispatch('editComplete');
    // Load voices after state reset to avoid conflicts
    setTimeout(() => loadAvailableVoices(), 100);
  }

</script>

<div class="bg-slate-800 rounded-lg shadow-lg p-6">
  <h2 class="text-xl font-bold mb-4 text-slate-100">
    {state === 'editing' ? $i18n.t('creator.titleEdit') : $i18n.t('creator.titleCreate')}
  </h2>

  {#if state === 'config'}
    <div class="space-y-4 animate-fade-in">
      <div>
        <label for="topic" class="block text-sm font-medium text-slate-300">{$i18n.t('creator.topicLabel')}</label>
        <input type="text" id="topic" bind:value={topic} placeholder={$i18n.t('creator.topicPlaceholder')} class="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3"/>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="style" class="block text-sm font-medium text-slate-300">{$i18n.t('creator.styleLabel')}</label>
          <select id="style" bind:value={narrationStyle} on:change={handleStyleChange} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
            {#each PODCAST_NARRATION_STYLES as s}
              <option value={s.id}>{$i18n.t(`styles.${s.id}`)}</option>
            {/each}
          </select>
        </div>
        <div>
           <label for="duration" class="block text-sm font-medium text-slate-300">{$i18n.t('creator.durationLabel')}</label>
           <div class="flex gap-2">
             <select id="duration" bind:value={duration} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
               {#each PODCAST_DURATIONS as d}
                 <option value={d}>{d}</option>
               {/each}
               <option value={0}>{$i18n.t('creator.durationCustom')}</option>
             </select>
             {#if duration === 0}
               <input type="number" bind:value={customDuration} min="1" class="mt-1 block w-24 bg-slate-700 border-slate-600 rounded-md py-2 px-3" />
             {/if}
           </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="language" class="block text-sm font-medium text-slate-300">{$i18n.t('creator.languageLabel')}</label>
          <select id="language" bind:value={language} on:change={handleLanguageChange} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
            {#each LANGUAGES as lang}
              <option value={lang.code}>{lang.name}</option>
            {/each}
          </select>
        </div>
        <div>
          <label for="format" class="block text-sm font-medium text-slate-300">{$i18n.t('creator.formatLabel')}</label>
          <select id="format" bind:value={style} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
            {#each PODCAST_STYLES as s}
              <option value={s.id}>{$i18n.t(`formats.${s.id}`)}</option>
            {/each}
          </select>
        </div>
      </div>
      
      <h3 class="text-md font-semibold text-slate-200 pt-2">{$i18n.t('creator.speakersLabel')}</h3>
      {#if style === 'solo'}
        {@const i = 0}
        <div class="space-y-3 p-3 bg-slate-700/50 rounded-md">
           <label class="text-sm font-medium text-slate-300">{$i18n.t('creator.speakerLabel')} 1</label>
            <input type="text" bind:value={speakers[i].name} placeholder={$i18n.t('creator.speakerNamePlaceholder', {number: '1'})} class="block w-full bg-slate-700 border-slate-600 rounded-md"/>
            <div class="flex gap-2 items-center">
              <select bind:value={speakers[i].voice} class="block w-full bg-slate-700 border-slate-600 rounded-md">
                <option disabled value="">{$i18n.t('creator.selectVoice')}</option>
                {#each loadingVoices ? [] : availableVoices as voice}
                  <option value={voice.id}>{voice.label}</option>
                {/each}
              </select>
              <button disabled={!speakers[i].voice || Boolean(previewingVoice)} on:click={() => handlePreviewVoice(speakers[i].voice)} title={$i18n.t('creator.previewAria', {voice: speakers[i].voice})} class="p-2 rounded-full disabled:opacity-50 hover:bg-slate-600 transition-colors">
                {#if previewingVoice === speakers[i].voice} <Spinner/> {:else} <Icon name="playCircle" className="w-6 h-6 text-blue-400"/> {/if}
              </button>
            </div>
        </div>
      {:else}
        {#each speakers as speaker, i}
          <div class="space-y-3 p-3 bg-slate-700/50 rounded-md">
            <label class="text-sm font-medium text-slate-300">{$i18n.t('creator.speakerLabel')} {i+1}</label>
            <input type="text" bind:value={speaker.name} placeholder={$i18n.t('creator.speakerNamePlaceholder', {number: String(i+1)})} class="block w-full bg-slate-700 border-slate-600 rounded-md"/>
            <div class="flex gap-2 items-center">
              <select bind:value={speaker.voice} class="block w-full bg-slate-700 border-slate-600 rounded-md">
                <option disabled value="">{$i18n.t('creator.selectVoice')}</option>
                {#each loadingVoices ? [] : availableVoices as voice}
                  <option value={voice.id}>{voice.label}</option>
                {/each}
              </select>
              <button disabled={!speaker.voice || Boolean(previewingVoice)} on:click={() => handlePreviewVoice(speaker.voice)} title={$i18n.t('creator.previewAria', {voice: speaker.voice})} class="p-2 rounded-full disabled:opacity-50 hover:bg-slate-600 transition-colors">
                {#if previewingVoice === speaker.voice} <Spinner/> {:else} <Icon name="playCircle" className="w-6 h-6 text-blue-400"/> {/if}
              </button>
            </div>
          </div>
        {/each}
      {/if}

      <div class="pt-2">
        <button on:click={handleGenerateScript} class="w-full flex justify-center items-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          <Icon name="edit3" className="h-5 w-5 mr-2"/> {$i18n.t('creator.generateScriptButton')}
        </button>
      </div>
    </div>
  {/if}

  {#if state === 'generating_script' || state === 'generating_audio'}
    <div class="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <Spinner />
      <p class="mt-4 text-slate-300">{progressMessage}</p>
      {#if state === 'generating_script' && streamingScript}
        <div class="w-full max-w-2xl mt-6">
          <div class="bg-slate-700 border border-slate-600 rounded-md p-4">
            <h3 class="text-sm font-medium text-slate-300 mb-2">{$i18n.t('creator.streamingScript')}</h3>
            <div class="text-slate-100 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {streamingScript}
            </div>
          </div>
        </div>
      {/if}
      {#if state === 'generating_audio'}
        <div class="w-full max-w-sm mt-4">
          <ProgressBar progress={audioProgress} />
        </div>
      {/if}
    </div>
  {/if}

  {#if state === 'editing' && draft}
    <ScriptEditor
      bind:draft={draft}
      bind:speakers
      {style}
      {availableVoices}
      {loadingVoices}
      on:back={() => {
        state = 'config';
        if (podcastToEdit) {
          dispatch('editComplete');
          // Reset editing state when going back
          isEditingExistingPodcast = false;
        }
      }}
      on:synthesize={handleSynthesizeAudio}
    />
  {/if}
</div>
