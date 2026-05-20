<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { i18n } from '@/stores';

  const dispatch = createEventDispatcher();
  
  let email = '';
  let submitted = false;
</script>

<div class="w-full max-w-md p-8 space-y-6 bg-slate-900 rounded-lg shadow-xl animate-fade-in">
  <h1 class="text-2xl font-bold text-center text-slate-100">{$i18n.t('forgotPassword.title')}</h1>
  {#if submitted}
    <div class="text-center">
      <p class="text-slate-300">{$i18n.t('forgotPassword.submittedText', { email })}</p>
    </div>
  {:else}
    <form on:submit|preventDefault={() => submitted = true} class="space-y-4">
      <p class="text-sm text-slate-400 text-center">{$i18n.t('forgotPassword.instruction')}</p>
      <div>
        <label class="block text-sm font-medium text-slate-300">{$i18n.t('forgotPassword.emailLabel')}</label>
        <input type="email" bind:value={email} required class="mt-1 block w-full bg-slate-800 border-slate-700 rounded-md py-2 px-3" />
      </div>
      <button type="submit" class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">{$i18n.t('forgotPassword.resetButton')}</button>
    </form>
  {/if}
  <div class="text-center text-sm text-slate-400">
    <button type="button" on:click={() => dispatch('navigate', 'login')} class="font-medium text-blue-500 hover:text-blue-400">{$i18n.t('forgotPassword.backToLogin')}</button>
  </div>
</div>
