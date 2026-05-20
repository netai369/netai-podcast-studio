<script lang="ts">
  import { tick } from 'svelte';
  import type { Document } from '@/types';
  import { parseDocument } from '@/utils/docParser';
  import { i18n } from '@/stores';

  import Spinner from '@/components/Spinner.svelte';
  import Icon from '@/components/Icons.svelte';

  export let documents: Document[] = [];

  let parsing = false;
  let error: string | null = null;
  let isDragActive = false;

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragActive = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragActive = false;
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragActive = false;
    parsing = true;
    error = null;
    let newDocuments: Document[] = [...documents];

    const files = Array.from(event.dataTransfer?.files || []);
    for (const file of files) {
      if (documents.some(doc => doc.name === file.name)) {
        continue;
      }
      try {
        const { name, content } = await parseDocument(file);
        newDocuments.push({ id: `doc_${Date.now()}_${name}`, name, content });
      } catch (err) {
        const msg = err instanceof Error ? err.message : $i18n.t('errors.unknown');
        error = msg;
        break;
      }
    }

    documents = newDocuments;
    parsing = false;
    await tick();
  }

  async function handleFileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    parsing = true;
    error = null;
    let newDocuments: Document[] = [...documents];

    for (const file of files) {
      if (documents.some(doc => doc.name === file.name)) {
        continue;
      }
      try {
        const { name, content } = await parseDocument(file);
        newDocuments.push({ id: `doc_${Date.now()}_${name}`, name, content });
      } catch (err) {
        const msg = err instanceof Error ? err.message : $i18n.t('errors.unknown');
        error = msg;
        break;
      }
    }

    documents = newDocuments;
    parsing = false;
    await tick();
  }

  function removeDocument(id: string) {
    documents = documents.filter(doc => doc.id !== id);
  }
</script>

<div class="bg-slate-800 rounded-lg shadow-lg p-6">
<h2 class="text-xl font-bold mb-4 text-slate-100">{$i18n.t('docManager.title')}</h2>
<div
  class="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors {isDragActive ? 'border-blue-500 bg-slate-700/50' : 'border-slate-600 hover:border-blue-500'}"
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
>
  <input type="file" multiple accept=".txt,.pdf,.docx,.odt" class="hidden" on:change={handleFileInput} />
  <div class="flex flex-col items-center justify-center text-slate-400">
    <Icon name="uploadCloud" className="h-12 w-12 mb-4" />
    {#if isDragActive}
      <p>{$i18n.t('docManager.dropActive')}</p>
    {:else}
      <p>{$i18n.t('docManager.dropInactive')}</p>
    {/if}
    <p class="text-xs mt-1">{$i18n.t('docManager.supportedFormats')}</p>
  </div>
</div>

  {#if parsing}
    <div class="mt-4 flex items-center justify-center text-slate-300">
      <Spinner />
      <span class="ml-2">{$i18n.t('docManager.parsing')}</span>
    </div>
  {/if}
  {#if error}
    <p class="mt-4 text-sm text-red-400 text-center">{error}</p>
  {/if}

  <div class="mt-6">
    {#if documents.length > 0}
      <ul class="space-y-3">
        {#each documents as doc (doc.id)}
          <li class="bg-slate-700 p-3 rounded-md flex items-center justify-between animate-fade-in">
            <div class="flex items-center truncate">
              <Icon name="fileText" className="h-5 w-5 mr-3 text-slate-400 flex-shrink-0" />
              <span class="text-sm text-slate-200 truncate" title={doc.name}>{doc.name}</span>
            </div>
            <button
              on:click={() => removeDocument(doc.id)}
              class="p-1 rounded-full text-slate-400 hover:bg-slate-600 hover:text-slate-100 transition-colors"
              title={$i18n.t('docManager.removeAria')}
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
