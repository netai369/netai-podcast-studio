<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { userStore, i18n } from '@/stores';
  import LanguageSelector from '@/components/LanguageSelector.svelte';
  import Icon from '@/components/Icons.svelte';

  const dispatch = createEventDispatcher();

  function handleLogout() {
    userStore.set(null);
    localStorage.removeItem('podcast_studio_currentUser');
  }
</script>

<header class="bg-slate-900/70 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-40">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center space-x-3">
        <div class="p-2 rounded-lg bg-blue-600">
          <Icon name="mic" className="h-6 w-6 text-white" />
        </div>
        <h1 class="text-xl font-bold text-slate-100">{$i18n.t('header.title')}</h1>
      </div>

      <div class="flex items-center gap-4">
        {#if $userStore}
          <div class="flex items-center gap-4">
            <span class="text-sm text-slate-400 hidden sm:block">
              {$i18n.t('header.welcome', { name: $userStore.username })}
            </span>
            <button on:click={handleLogout} class="text-sm text-slate-400 hover:text-white">
              {$i18n.t('header.logout')}
            </button>
          </div>
        {/if}
        <LanguageSelector />
        <button 
          on:click={() => dispatch('openSettings')}
          class="p-2 text-slate-400 hover:text-slate-100 rounded-full transition-colors"
          title={$i18n.t('header.settings')}
        >
          <Icon name="settings" className="h-6 w-6" />
        </button>
      </div>
    </div>
  </div>
</header>
