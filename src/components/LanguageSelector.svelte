<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { i18n } from '@/stores';
  import type { Language } from '@/types';
  import Icon from '@/components/Icons.svelte';
  
  const LANGUAGES: { code: Language, name: string, icon: 'gb' | 'de' | 'es' | 'fr' | 'it' }[] = [
      { code: 'en', name: 'English', icon: 'gb' },
      { code: 'de', name: 'Deutsch', icon: 'de' },
      { code: 'es', name: 'Español', icon: 'es' },
      { code: 'fr', name: 'Français', icon: 'fr' },
      { code: 'it', name: 'Italiano', icon: 'it' },
  ];

  let isOpen = false;
  let dropdown: HTMLDivElement;
  
  let selectedLanguage = LANGUAGES.find(l => l.code === $i18n.lang) || LANGUAGES[0];
  $: selectedLanguage = LANGUAGES.find(l => l.code === $i18n.lang) || LANGUAGES[0];
  
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdown && !dropdown.contains(event.target as Node)) {
      isOpen = false;
    }
  };

  onMount(() => document.addEventListener('click', handleClickOutside, true));
  onDestroy(() => document.removeEventListener('click', handleClickOutside, true));

  function handleSelect(lang: Language) {
    i18n.setLanguage(lang);
    isOpen = false;
  }
</script>

<div class="relative" bind:this={dropdown}>
  <button on:click={() => isOpen = !isOpen} class="flex items-center gap-2 text-slate-300 hover:text-white p-2 rounded-md">
    <Icon name={selectedLanguage.icon} className="h-5 w-5 rounded-sm" />
    <span class="text-sm font-medium">{selectedLanguage.code.toUpperCase()}</span>
  </button>
  {#if isOpen}
    <div class="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50 animate-fade-in">
      <ul class="py-1">
        {#each LANGUAGES as { code, name, icon }}
          <li>
            <button on:click={() => handleSelect(code)} class="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white">
              <Icon name={icon} className="h-5 w-5 rounded-sm" />
              <span>{name}</span>
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
