<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { i18n, settingsStore } from '@/stores';
  import type { SpeakerConfig, PodcastStyle } from '@/types';
  import { generateVoicePreviewAudio } from '@/services/api';
  import { playBase64Audio } from '@/utils/audio';
  import Icon from '@/components/Icons.svelte';
  import Spinner from '@/components/Spinner.svelte';

  export let draft: { title: string, description: string, script: string };
  export let speakers: SpeakerConfig[] = [];
  export let style: PodcastStyle = 'solo';
  export let availableVoices: { id: string; name: string; gender: 'M' | 'F'; label: string }[] = [];
  export let loadingVoices = false;

  const dispatch = createEventDispatcher();

  let previewingVoice: string | boolean | null = null;

  async function handlePreviewVoice(voice: string) {
    if (previewingVoice === voice) return;
    previewingVoice = voice;
    try {
      const audioB64 = await generateVoicePreviewAudio(voice, $settingsStore);
      await playBase64Audio(audioB64);
    } catch (e) {
      console.error("Failed to play voice preview", e);
      alert($i18n.t('errors.audioPreview'));
    } finally {
      previewingVoice = null;
    }
  }
</script>

<div class="space-y-4 animate-fade-in">
  <div>
    <label class="block text-sm font-medium text-slate-300">{$i18n.t('editor.titleLabel')}</label>
    <input type="text" bind:value={draft.title} class="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3"/>
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-300">{$i18n.t('editor.descriptionLabel')}</label>
    <textarea bind:value={draft.description} rows={2} class="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3"/>
  </div>
  <div>
    <label class="block text-sm font-medium text-slate-300">{$i18n.t('editor.scriptLabel')}</label>
    <textarea bind:value={draft.script} rows={10} class="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3"/>
  </div>

  <h3 class="text-md font-semibold text-slate-200 pt-2">{$i18n.t('creator.speakersLabel')}</h3>
  {#if style === 'solo'}
    {@const i = 0}
    <div class="space-y-3 p-3 bg-slate-700/50 rounded-md">
       <label class="text-sm font-medium text-slate-300">{$i18n.t('creator.speakerLabel')} 1</label>
        <input type="text" bind:value={speakers[i].name} placeholder={$i18n.t('creator.speakerNamePlaceholder', {number: '1'})} class="block w-full bg-slate-700 border-slate-600 rounded-md"/>
         <div class="flex gap-2 items-center">
           <select bind:value={speakers[i].voice} class="block flex-1 min-w-0 bg-slate-700 border-slate-600 rounded-md">
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
           <select bind:value={speaker.voice} class="block flex-1 min-w-0 bg-slate-700 border-slate-600 rounded-md">
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

  <div class="flex gap-4 pt-2">
    <button on:click={() => dispatch('back')} class="w-full flex justify-center py-2 px-4 border border-slate-600 rounded-md text-sm font-medium text-slate-300 bg-slate-700 hover:bg-slate-600">
      <Icon name="arrowLeft" className="h-5 w-5 mr-2" /> {$i18n.t('editor.backButton')}
    </button>
    <button on:click={() => dispatch('synthesize')} class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
      <Icon name="mic" className="h-5 w-5 mr-2" /> {$i18n.t('editor.synthesizeButton')}
    </button>
  </div>
</div>
