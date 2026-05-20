<script lang="ts">
  import { userStore } from '@/stores';
  import type { Podcast, Document, AuthView } from '@/types';

  import Header from '@/components/Header.svelte';
  import DocumentManager from '@/components/DocumentManager.svelte';
  import PodcastCreator from '@/components/PodcastCreator.svelte';
  import PodcastList from '@/components/PodcastList.svelte';
  import AudioPlayer from '@/components/AudioPlayer.svelte';
  import SettingsPage from '@/components/SettingsPage.svelte';
  import LoginPage from '@/components/LoginPage.svelte';
  import RegisterPage from '@/components/RegisterPage.svelte';
  import ForgotPasswordPage from '@/components/ForgotPasswordPage.svelte';
  import { onMount } from 'svelte';

  let documents: Document[] = [];
  let podcasts: Podcast[] = [];

  let playingPodcast: Podcast | null = null;
  let editingPodcast: Podcast | null = null;
  let isSettingsOpen = false;
  let authView: AuthView = 'login';

  onMount(() => {
    // This reactive statement automatically saves podcasts when they change
    userStore.subscribe(user => {
      if (user) {
        const saved = localStorage.getItem(`podcasts_${user.email}`);
        podcasts = saved ? JSON.parse(saved).map((p: any) => ({...p, createdAt: new Date(p.createdAt)})) : [];
      } else {
        podcasts = [];
        documents = [];
      }
    });
  });

  $: if ($userStore) {
    localStorage.setItem(`podcasts_${$userStore.email}`, JSON.stringify(podcasts));
  }
  
  function handlePodcastCreated(event: CustomEvent<Podcast>) {
    const newPodcast = event.detail;
    const existingIndex = podcasts.findIndex(p => p.id === newPodcast.id);
    if (existingIndex !== -1) {
      // Replace existing podcast if ID matches (for edits)
      podcasts[existingIndex] = newPodcast;
    } else {
      // Add new podcast at the beginning
      podcasts = [newPodcast, ...podcasts];
    }
    editingPodcast = null;
  }

  function handlePodcastUpdated(event: CustomEvent<Podcast>) {
    const updatedPodcast = event.detail;
    podcasts = podcasts.map(p => p.id === updatedPodcast.id ? updatedPodcast : p);
    editingPodcast = null;
  }

  function handleEditPodcast(event: CustomEvent<Podcast>) {
    editingPodcast = event.detail;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleDeletePodcast(event: CustomEvent<string>) {
    podcasts = podcasts.filter(p => p.id !== event.detail);
  }
</script>

<div class="text-slate-200 min-h-screen font-sans bg-slate-950">
  {#if !$userStore}
    <div class="flex items-center justify-center min-h-screen">
      {#if authView === 'login'}
        <LoginPage on:navigate={(e) => authView = e.detail} />
      {:else if authView === 'register'}
        <RegisterPage on:navigate={(e) => authView = e.detail} />
      {:else if authView === 'forgotPassword'}
        <ForgotPasswordPage on:navigate={(e) => authView = e.detail} />
      {/if}
    </div>
  {:else}
    <Header on:openSettings={() => isSettingsOpen = true} />
    
    <main class="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-2 lg:gap-8">
        <div class="space-y-8">
          <DocumentManager bind:documents />
          <PodcastCreator 
            {documents} 
            podcastToEdit={editingPodcast}
            on:podcastCreated={editingPodcast ? handlePodcastUpdated : handlePodcastCreated}
            on:editComplete={() => editingPodcast = null}
          />
        </div>
        <PodcastList 
          {podcasts}
          on:play={(e) => playingPodcast = e.detail}
          on:edit={handleEditPodcast}
          on:delete={handleDeletePodcast}
        />
      </div>
    </main>

    {#if playingPodcast}
      <AudioPlayer podcast={playingPodcast} on:close={() => playingPodcast = null} />
    {/if}

    {#if isSettingsOpen}
      <SettingsPage on:close={() => isSettingsOpen = false} />
    {/if}
  {/if}
</div>
