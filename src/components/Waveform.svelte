<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { computePeaks, drawPeaks, decodeAudioSamples } from '@/utils/audio';

  export let src: string | null = null;
  export let samples: Float32Array | null = null;
  export let peaks: Float32Array | null = null;
  export let progress = 0;
  export let height = 64;
  export let color = '#38BDF8';
  export let dimColor = '#4A5568';
  export let backgroundColor = 'rgb(30 41 59)';
  export let interactive = true;
  export let columns = 1000;
  export let label = 'Waveform';

  const dispatch = createEventDispatcher<{ seek: number }>();

  let canvas: HTMLCanvasElement | null = null;
  let resolved: Float32Array | null = null;
  let decodedSrc: string | null = null;
  let loading = false;

  async function loadSource(url: string) {
    if (decodedSrc === url) return;
    decodedSrc = url;
    loading = true;
    try {
      const data = await decodeAudioSamples(url);
      resolved = computePeaks(data, columns);
    } catch (e) {
      console.error('Waveform: failed to decode audio', e);
      resolved = null;
    } finally {
      loading = false;
    }
  }

  $: if (src) loadSource(src);
  $: if (samples) resolved = computePeaks(samples, columns);
  $: {
    void peaks;
    void progress;
    void resolved;
    void canvas;
    drawPeaks(canvas, peaks ?? resolved, { color, dimColor, backgroundColor, progress, lineWidth: 2 });
  }

  function handleClick(event: MouseEvent) {
    if (!interactive || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const fraction = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    dispatch('seek', fraction);
  }
</script>

<div class="relative w-full rounded-md overflow-hidden bg-slate-900/50" style={`height:${height}px`}>
  <canvas
    bind:this={canvas}
    width={columns}
    height={height}
    aria-label={label}
    class={interactive ? 'w-full h-full cursor-pointer' : 'w-full h-full'}
    on:click={handleClick}
  ></canvas>
  {#if loading}
    <span class="absolute inset-0 flex items-center justify-center text-xs text-slate-400">…</span>
  {/if}
</div>
