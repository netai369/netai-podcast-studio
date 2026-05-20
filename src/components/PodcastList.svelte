<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Podcast } from '@/types';
  import { i18n } from '@/stores';
  import Icon from '@/components/Icons.svelte';

  export let podcasts: Podcast[] = [];

  const dispatch = createEventDispatcher();
</script>

<div class="bg-slate-800 rounded-lg shadow-lg p-6 mt-8 lg:mt-0 animate-fade-in">
  <h2 class="text-xl font-bold mb-4 text-slate-100">{$i18n.t('podcastList.title')}</h2>
  
  {#if podcasts.length === 0}
    <div class="text-center text-slate-400 py-8">
      <Icon name="mic" className="h-12 w-12 mx-auto text-slate-600 mb-4" />
      <p>{$i18n.t('podcastList.empty')}</p>
    </div>
  {:else}
    <ul class="space-y-4">
      {#each podcasts as podcast (podcast.id)}
        <li class="bg-slate-700/50 p-4 rounded-lg flex items-start justify-between animate-fade-in">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-slate-100 truncate" title={podcast.title}>{podcast.title}</h3>
            <p class="text-sm text-slate-400 truncate mt-1">{podcast.description}</p>
            <div class="text-xs text-slate-500 mt-2">
              <span>{$i18n.t('podcastList.duration', { duration: String(podcast.duration) })}</span> &bull; <span>{podcast.createdAt.toLocaleDateString()}</span>
              {#if podcast.speakers && podcast.speakers.length > 0}
                 &bull; <span class="text-slate-400">
                   {#if podcast.style === 'solo'}
                     {podcast.speakers[0].voice}
                   {:else}
                     {podcast.speakers.map(s => s.voice).join(', ')}
                   {/if}
                 </span>
              {/if}
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              on:click={() => dispatch('edit', podcast)}
              class="p-2 text-slate-400 hover:text-blue-400 transition-colors rounded-full"
              title={$i18n.t('podcastList.editAria')}
            >
              <Icon name="edit3" className="h-5 w-5" />
            </button>
            <button
              on:click={() => dispatch('delete', podcast.id)}
              class="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-full"
              title={$i18n.t('podcastList.deleteAria')}
            >
              <Icon name="x" className="h-5 w-5" />
            </button>
            <button
              on:click={() => dispatch('play', podcast)}
              class="flex items-center justify-center p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              title={$i18n.t('podcastList.playAria')}
            >
              <Icon name="playCircle" className="h-6 w-6" />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>
