<script lang="ts">
  export let movie: any;
  let poster = movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : '';

  function toggleSeen() {
    const key = 'seen_' + movie.id;
    const current = localStorage.getItem(key) === '1';
    localStorage.setItem(key, current ? '0' : '1');
    window.dispatchEvent(new CustomEvent('movie:toggleSeen', { detail: { id: movie.id } }));
  }

  function addWatchlist() {
    const list = JSON.parse(localStorage.getItem('watchlist') || '[]');
    if (!list.find((x: any) => x.id === movie.id)) {
      list.push({ id: movie.id, title: movie.title, poster });
      localStorage.setItem('watchlist', JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('watchlist:updated'));
    }
  }
</script>

<div class="rounded-lg overflow-hidden shadow">
  {#if poster}
    <img src={poster} alt={movie.title} class="w-full h-56 object-cover" />
  {/if}
  <div class="p-3">
    <h3 class="font-semibold">{movie.title}</h3>
    <p class="text-sm text-gray-600">{movie.release_date}</p>
    <p class="mt-2">Rating: {movie.vote_average}</p>
    <div class="mt-3 flex gap-2">
      <button on:click={toggleSeen} class="px-2 py-1 border rounded">Marcar vista</button>
      <button on:click={addWatchlist} class="px-2 py-1 bg-amber-500 rounded text-white">Agregar</button>
    </div>
  </div>
</div>
