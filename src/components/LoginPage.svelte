<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { User } from '@/types';
  import { i18n, userStore } from '@/stores';
  import Icon from '@/components/Icons.svelte';

  const dispatch = createEventDispatcher();

  let email = '';
  let password = '';
  let error = '';

  function handleSubmit() {
    error = '';
    const usersJSON = localStorage.getItem('podcast_studio_users');
    const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      localStorage.setItem('podcast_studio_currentUser', user.email);
      userStore.set(user);
    } else {
      error = $i18n.t('login.error');
    }
  }
</script>

<div class="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-lg shadow-xl animate-fade-in">
  <div class="flex flex-col items-center">
    <div class="p-3 rounded-lg bg-blue-600 mb-4">
      <Icon name="mic" className="h-8 w-8 text-white" />
    </div>
    <h1 class="text-2xl font-bold text-center text-slate-100">{$i18n.t('login.title')}</h1>
  </div>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if error}
      <p class="text-sm text-red-400 text-center">{error}</p>
    {/if}
    <div>
      <label class="block text-sm font-medium text-slate-300">{$i18n.t('login.emailLabel')}</label>
      <input type="email" bind:value={email} required class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-300">{$i18n.t('login.passwordLabel')}</label>
      <input type="password" bind:value={password} required class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
    </div>
    <div class="text-right text-sm">
      <button type="button" on:click={() => dispatch('navigate', 'forgotPassword')} class="font-medium text-blue-500 hover:text-blue-400">{$i18n.t('login.forgotPassword')}</button>
    </div>
    <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">{$i18n.t('login.loginButton')}</button>
  </form>
  <div class="text-center text-sm text-slate-400">
    {$i18n.t('login.noAccount')} <button type="button" on:click={() => dispatch('navigate', 'register')} class="font-medium text-blue-500 hover:text-blue-400">{$i18n.t('login.registerLink')}</button>
  </div>
</div>
