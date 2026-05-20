<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { User } from '@/types';
  import { i18n, userStore } from '@/stores';

  const dispatch = createEventDispatcher();

  let username = '';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let error = '';

  function handleSubmit() {
    error = '';
    if (password !== confirmPassword) {
      error = $i18n.t('register.errorMatch');
      return;
    }
    
    const usersJSON = localStorage.getItem('podcast_studio_users');
    const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];

    if (users.some(u => u.email === email)) {
      error = $i18n.t('register.errorExists');
      return;
    }

    const newUser: User = { username, email, password };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('podcast_studio_users', JSON.stringify(updatedUsers));
    localStorage.setItem('podcast_studio_currentUser', newUser.email);
    userStore.set(newUser);
  }
</script>

<div class="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-lg shadow-xl animate-fade-in">
  <h1 class="text-2xl font-bold text-center text-slate-100">{$i18n.t('register.title')}</h1>
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    {#if error}
      <p class="text-sm text-red-400 text-center">{error}</p>
    {/if}
    <div>
      <label class="block text-sm font-medium text-slate-300">{$i18n.t('register.usernameLabel')}</label>
      <input type="text" bind:value={username} required class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-300">{$i18n.t('register.emailLabel')}</label>
      <input type="email" bind:value={email} required class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-300">{$i18n.t('register.passwordLabel')}</label>
      <input type="password" bind:value={password} required minlength="6" class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
    </div>
    <div>
      <label class="block text-sm font-medium text-slate-300">{$i18n.t('register.confirmPasswordLabel')}</label>
      <input type="password" bind:value={confirmPassword} required class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
    </div>
    <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">{$i18n.t('register.registerButton')}</button>
  </form>
  <div class="text-center text-sm text-slate-400">
    {$i18n.t('register.haveAccount')} <button type="button" on:click={() => dispatch('navigate', 'login')} class="font-medium text-blue-500 hover:text-blue-400">{$i18n.t('register.loginLink')}</button>
  </div>
</div>
