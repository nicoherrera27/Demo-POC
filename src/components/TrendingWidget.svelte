<script lang="ts">
  import { onMount } from 'svelte';
  import type { Movie, TVShow } from '../types/movies.ts';
  import { tmdbApi, IMAGE_BASE_URL } from '../lib/tmdb';

  let trendingMovies: Movie[] = [];
  let trendingTVShows: TVShow[] = [];
  let loading = true;
  let currentSlide = 0;
  let activeTab: 'movies' | 'tv' = 'movies';

  onMount(async () => {
    try {
      const [moviesResponse, tvResponse] = await Promise.all([
        tmdbApi.getTrendingMovies(),
        tmdbApi.getTrendingTVShows()
      ]);
      
      trendingMovies = moviesResponse.results.slice(0, 6);
      trendingTVShows = tvResponse.results.slice(0, 6);
    } catch (error) {
      alert('Error fetching trending:' + error);
    } finally {
      loading = false;
    }

    setInterval(() => {
      const maxSlides = activeTab === 'movies' ? trendingMovies.length : trendingTVShows.length;
      currentSlide = (currentSlide + 1) % Math.max(1, maxSlides - 2);
    },9999999);
  });

  function getTitle(item: Movie | TVShow): string {
    return 'title' in item ? item.title : item.name;
  }

  function getReleaseYear(item: Movie | TVShow): string {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return new Date(date).getFullYear().toString();
  }
</script>

<div class="bg-gradient-to-r from-purple-900 to-blue-900 p-6 rounded-lg shadow-lg">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-white">📈 Tendencias (Svelte Component)</h2>
    
    <div class="flex gap-2">
      <button class="px-4 py-2 rounded-lg font-medium transition-all {activeTab === 'movies' ? 'bg-white text-purple-900' : 'bg-purple-700 text-white hover:bg-purple-600'}" on:click={() => { activeTab = 'movies'; currentSlide = 0; }}>
        Películas
      </button>
      <button class="px-4 py-2 rounded-lg font-medium transition-all {activeTab === 'tv' ? 'bg-white text-purple-900' : 'bg-purple-700 text-white hover:bg-purple-600'}" on:click={() => { activeTab = 'tv'; currentSlide = 0; }}>
        Series
      </button>
    </div>
  </div>

  {#if loading}
    <div class="text-center py-12">
      <div class="text-white text-lg">Cargando tendencias...</div>
    </div>
  {:else}
    <div class="relative overflow-hidden">
      <div 
        class="flex transition-transform duration-500 ease-in-out"
        style="transform: translateX(-{currentSlide * 33.333}%)"
      >
        {#each activeTab === 'movies' ? trendingMovies : trendingTVShows as item (item.id)}
          <div class="flex-shrink-0 w-1/3 px-2">
            <div class="bg-black bg-opacity-30 rounded-lg overflow-hidden backdrop-blur-sm hover:scale-105 transition-transform duration-300">
              <div class="relative">
                <img src="{IMAGE_BASE_URL}{item.poster_path}" alt="{getTitle(item)}" class="w-full h-48 object-cover"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                <div class="absolute bottom-2 left-2 right-2">
                  <div class="flex items-center justify-between text-white text-sm">
                    <span class="font-bold">⭐ {item.vote_average.toFixed(1)}</span>
                    <span>{getReleaseYear(item)}</span>
                  </div>
                </div>
              </div>
              
              <div class="p-4">
                <h3 class="text-white font-semibold text-sm mb-2 line-clamp-2">
                  {getTitle(item)}
                </h3>
                <p class="text-gray-300 text-xs line-clamp-3">
                  {item.overview}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <button class="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all" on:click={() => { const maxSlides = activeTab === 'movies' ? trendingMovies.length : trendingTVShows.length; currentSlide = (currentSlide - 1 + Math.max(1, maxSlides - 2)) % Math.max(1, maxSlides - 2);}}>
        ◀
      </button>

      <button class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all" on:click={() => { const maxSlides = activeTab === 'movies' ? trendingMovies.length : trendingTVShows.length; currentSlide = (currentSlide + 1) % Math.max(1, maxSlides - 2);}}>
        ▶ 
      </button>      

      <div class="flex justify-center mt-4 gap-2">
        {#each Array(Math.max(1, (activeTab === 'movies' ? trendingMovies.length : trendingTVShows.length) - 2)) as _, i}
          <button class="w-2 h-2 rounded-full transition-colors {currentSlide === i ? 'bg-white' : 'bg-gray-500'}" on:click={() => currentSlide = i}></button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>