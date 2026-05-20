<script lang="ts">
  export let progress: number;
</script>

<div class="w-full bg-slate-700 rounded-full h-2.5">
  <div
    class="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
    style="width: {progress}%"
  ></div>
</div>
