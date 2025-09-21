<script lang="ts">
  import { onMount } from 'svelte';
  import MovieCard from './MovieCard.svelte';
  export let movies: any[] = [];

  let list = movies.slice();

  function handleResults(e: any) {
    const results = e?.detail || [];
    list = results;
  }

  onMount(() => {
    window.addEventListener('results', handleResults);
    return () => window.removeEventListener('results', handleResults);
  });
</script>

{#if list.length === 0}
  <div class="text-sm text-gray-600">No hay resultados</div>
{:else}
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each list as movie (movie.id)}
      <MovieCard movie={movie} />
    {/each}
  </div>
{/if}
