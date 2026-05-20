<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { settingsStore, i18n } from '@/stores';
  import Icon from '@/components/Icons.svelte';
  import { fetchAvailableModels } from '@/services/ttsServices';
  import type { AvailableModels } from '@/types';

  const dispatch = createEventDispatcher();

  let availableModels: AvailableModels[] = [];
  let loadingModels = false;
  let modelsError = '';

  // Provider-specific configurations
  const providerConfigs: Record<string, { defaultUrl: string; placeholder: string; defaultModel: string }> = {
    gemini: {
      defaultUrl: '',
      placeholder: '',
      defaultModel: 'gemini-2.0-flash-exp'
    },
    openai: {
      defaultUrl: 'https://api.openai.com/v1/chat/completions',
      placeholder: 'sk-...',
      defaultModel: 'gpt-4o'
    },
    cerebras: {
      defaultUrl: 'https://api.cerebras.ai/v1/chat/completions',
      placeholder: 'cerebras-api-key-...',
      defaultModel: 'llama3.1-70b'
    },
    claude: {
      defaultUrl: 'https://api.anthropic.com/v1/messages',
      placeholder: 'sk-ant-api03-...',
      defaultModel: 'claude-3-5-sonnet'
    },
    mistral: {
      defaultUrl: 'https://api.mistral.ai/v1/chat/completions',
      placeholder: 'mistral-api-key-...',
      defaultModel: 'mistral-large'
    },
    xai: {
      defaultUrl: 'https://api.x.ai/v1/chat/completions',
      placeholder: 'xai-api-key-...',
      defaultModel: 'grok-beta'
    },
    openrouter: {
      defaultUrl: 'https://openrouter.ai/api/v1/chat/completions',
      placeholder: 'sk-or-v1-...',
      defaultModel: 'anthropic/claude-3.5-sonnet'
    }
  };

  // Track previous provider to detect changes
  let previousProvider = $settingsStore.llm.provider;

  // Update URL and model when provider changes
  $: if ($settingsStore.llm.provider && providerConfigs[$settingsStore.llm.provider]) {
    // Only execute if provider actually changed
    if ($settingsStore.llm.provider !== previousProvider) {
      previousProvider = $settingsStore.llm.provider;
      const config = providerConfigs[$settingsStore.llm.provider];
      
      // Always update URL and model when provider changes (except for Gemini)
      if (config.defaultUrl && $settingsStore.llm.provider !== 'gemini') {
        settingsStore.update(settings => ({
          ...settings,
          llm: {
            ...settings.llm,
            openAiUrl: config.defaultUrl,
            model: config.defaultModel
          }
        }));
        // Load models immediately after updating the URL (except for Claude)
        if (['openai', 'cerebras', 'mistral', 'xai', 'openrouter'].includes($settingsStore.llm.provider)) {
          loadModels();
        }
      }
    }
  }

  function getProviderConfig() {
    return providerConfigs[$settingsStore.llm.provider] || providerConfigs.openai;
  }

  async function loadModels() {
    const needsCustomApi = ['openai', 'cerebras', 'mistral', 'xai', 'openrouter'];
    // Claude doesn't have a public models endpoint
    if (!needsCustomApi.includes($settingsStore.llm.provider) || !$settingsStore.llm.openAiUrl) {
      availableModels = [];
      return;
    }

    loadingModels = true;
    modelsError = '';
    
    try {
      availableModels = await fetchAvailableModels($settingsStore);
      if (availableModels.length === 0 && $settingsStore.llm.model) {
        // Add current model if it's not in the list
        availableModels.unshift({
          id: $settingsStore.llm.model,
          object: 'model',
          created: Date.now(),
          owned_by: 'user'
        });
      }
    } catch (error) {
      modelsError = $i18n.t('settings.modelsError');
      console.error('Failed to load models:', error);
    } finally {
      loadingModels = false;
    }
  }

</script>

<div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" on:click|self={() => dispatch('close')}>
   <div class="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md m-4 p-6 border border-slate-700 relative max-h-[90vh] overflow-y-auto">
    <button on:click={() => dispatch('close')} class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full" aria-label={$i18n.t('settings.closeAria')}>
      <Icon name="x" className="h-6 w-6" />
    </button>
    <h2 class="text-2xl font-bold text-slate-100 mb-6">{$i18n.t('settings.title')}</h2>

    <div class="space-y-6">
      <!-- LLM Settings -->
      <div class="space-y-3">
        <h3 class="text-lg font-semibold text-slate-200">{$i18n.t('settings.llmTitle')}</h3>
        <div>
          <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.provider')}</label>
          <select bind:value={$settingsStore.llm.provider} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI Compatible</option>
            <option value="cerebras">Cerebras</option>
            <option value="claude">Claude (Anthropic)</option>
            <option value="mistral">Mistral AI</option>
            <option value="xai">xAI (Grok)</option>
            <option value="openrouter">OpenRouter</option>
          </select>
        </div>
        {#if ['openai', 'cerebras', 'claude', 'mistral', 'xai', 'openrouter'].includes($settingsStore.llm.provider)}
          <div>
            <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.apiUrl')}</label>
            <input type="text" bind:value={$settingsStore.llm.openAiUrl} placeholder={getProviderConfig().defaultUrl} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"/>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.apiKey')}</label>
            <input type="password" bind:value={$settingsStore.llm.openAiKey} placeholder={getProviderConfig().placeholder} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"/>
          </div>
          {#if ['openai', 'cerebras', 'claude', 'mistral', 'xai', 'openrouter'].includes($settingsStore.llm.provider)}
            <div>
              <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.model')}</label>
              <select bind:value={$settingsStore.llm.model} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
                {#if loadingModels}
                  <option disabled selected>{$i18n.t('settings.modelsLoading')}</option>
                {:else if modelsError}
                  <option disabled selected>{$i18n.t('settings.modelsError')}</option>
                  <!-- Show default model even on error so user isn't stuck -->
                  <option value={getProviderConfig().defaultModel}>{getProviderConfig().defaultModel}</option>
                {:else if availableModels.length > 0}
                  {#each availableModels as model}
                    <option value={model.id}>{model.id}</option>
                  {/each}
                {:else}
                  <!-- Fallback to default model if no models are loaded -->
                  <option value={getProviderConfig().defaultModel}>{getProviderConfig().defaultModel}</option>
                {/if}
              </select>
            </div>
          {/if}
          <div class="mt-2 p-3 bg-slate-700/50 rounded-md text-xs text-slate-400">
            <p><strong>Note:</strong> To prevent CORS errors, your custom API endpoint must be configured to accept requests from this application.</p>
            <p class="mt-1">Please ensure your server's response includes the `Access-Control-Allow-Origin` header (e.g., `Access-Control-Allow-Origin: *`).</p>
          </div>
        {/if}
      </div>

      <!-- Debug Settings -->
      <div class="space-y-3">
        <h3 class="text-lg font-semibold text-slate-200">{$i18n.t('settings.debugTitle')}</h3>
        <div>
          <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.logLevel')}</label>
          <select bind:value={$settingsStore.debug.logLevel} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
            <option value="ERROR">ERROR</option>
            <option value="INFO">INFO</option>
            <option value="DEBUG">DEBUG</option>
          </select>
        </div>
      </div>

      <!-- TTS Settings -->
      <div class="space-y-3">
        <h3 class="text-lg font-semibold text-slate-200">{$i18n.t('settings.ttsTitle')}</h3>
        <div>
          <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.provider')}</label>
<select bind:value={$settingsStore.tts.provider} class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3">
             <option value="gemini">Google Gemini</option>
             <option value="openai">OpenAI TTS</option>
             <option value="edge-tts">Microsoft Edge TTS (Free)</option>
             <option value="openaudio-s1">OpenAudio-S1 / XTTS</option>
             <option value="supertonic">Supertonic (OpenAI-compatible)</option>
           </select>
        </div>
        {#if $settingsStore.tts.provider === 'edge-tts'}
          <div class="mt-2 p-3 bg-slate-700/50 rounded-md text-xs text-slate-400">
            <p><strong>Note:</strong> Microsoft Edge TTS runs directly in your browser. No API key or external server required.</p>
            <p class="mt-1">It provides high-quality multilingual voices for free.</p>
          </div>
        {:else if $settingsStore.tts.provider === 'openai'}
          <div>
            <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.apiUrl')}</label>
            <input type="text" bind:value={$settingsStore.tts.openAudioUrl} placeholder="http://localhost:3001/api" class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"/>
          </div>
          <div class="mt-2 p-3 bg-slate-700/50 rounded-md text-xs text-slate-400">
            <p><strong>Note:</strong> OpenAI TTS API will be used with standard voices: alloy, echo, fable, onyx, nova, shimmer.</p>
          </div>
{:else if $settingsStore.tts.provider === 'openaudio-s1'}
           <div>
             <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.apiUrl')}</label>
             <input type="text" bind:value={$settingsStore.tts.openAudioUrl} placeholder="http://localhost:8000/tts" class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"/>
           </div>
            <div class="mt-2 p-3 bg-slate-700/50 rounded-md text-xs text-slate-400">
             <p><strong>Note:</strong> To prevent CORS errors, your custom API endpoint must be configured to accept requests from this application.</p>
             <p class="mt-1">Please ensure your server's response includes the `Access-Control-Allow-Origin` header (e.g., `Access-Control-Allow-Origin: *`).</p>
           </div>
         {:else if $settingsStore.tts.provider === 'supertonic'}
           <div>
             <label class="text-sm font-medium text-slate-300">{$i18n.t('settings.apiUrl')}</label>
             <input type="text" bind:value={$settingsStore.tts.openAudioUrl} placeholder="http://localhost:8800/v1/audio/speech" class="mt-1 block w-full bg-slate-700 border-slate-600 rounded-md py-2 px-3"/>
           </div>
           <div class="mt-2 p-3 bg-slate-700/50 rounded-md text-xs text-slate-400">
             <p><strong>Note:</strong> Supertonic provides OpenAI-compatible TTS with voice mixing capabilities.</p>
             <p class="mt-1">Supports 13 voices (alloy, nova, shimmer, ash, coral, echo, fable, onyx, cedar, verse) and voice mixing via /v1/voices/mix.</p>
           </div>
         {/if}
      </div>
    </div>

    <div class="mt-8 text-right">
      <button on:click={() => dispatch('close')} class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{$i18n.t('settings.doneButton')}</button>
    </div>
  </div>
</div>