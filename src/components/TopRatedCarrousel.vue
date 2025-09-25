<template>
  <div class="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 rounded-lg shadow-lg">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-purple-400">
        🏆 Mejor Valorados (Vue Component)
      </h2>
      
      <div class="flex gap-2">
        <button @click="switchTab('movies')" :class="['px-4 py-2 rounded-lg font-medium transition-all', activeTab === 'movies' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']">
          Películas ({{ topMovies.length }})
        </button>
        <button @click="switchTab('series')" :class="['px-4 py-2 rounded-lg font-medium transition-all', activeTab === 'series' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600']">
          Series ({{ topTVShows.length }})
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="text-purple-400 text-lg mb-2">
        Cargando contenido mejor valorado...
      </div>
      <div class="text-gray-400 text-sm">
        Conectando con TMDB API
      </div>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-400 text-lg mb-4">
        {{ error }}
      </div>
      <button @click="fetchData" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
        Reintentar
      </button>
    </div>

    <div v-else-if="getCurrentItems().length > 0" class="relative">
      <template v-if="getCurrentItems().length > 4">
        <button @click="prevSlide" class="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all">
          ◀
        </button>
        
        <button @click="nextSlide" class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all">
          ▶
        </button>
      </template>

      <div class="overflow-hidden rounded-lg">
        <div class="flex transition-transform duration-500 ease-in-out" :style="`transform: translateX(-${currentIndex * 25}%)`">
          <div v-for="(item, index) in getCurrentItems()" :key="item.id" class="flex-shrink-0 w-1/4 p-2">
            <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div class="relative group">
                <img v-if="item.poster_path" :src="`https://image.tmdb.org/t/p/w500${item.poster_path}`" :alt="getTitle(item)" class="w-full h-56 object-cover" loading="lazy"/>
                <div v-else class="w-full h-56 bg-gray-600 flex items-center justify-center">
                  <div class="text-center">
                    <div class="text-gray-400 text-2xl mb-2">🎬</div>
                    <span class="text-gray-400 text-sm">Sin imagen</span>
                  </div>
                </div>
                
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="absolute bottom-2 left-2 right-2">
                    <div class="text-white text-sm">
                      <div class="font-bold mb-1">
                        {{ item.vote_average.toFixed(1) }}
                      </div>
                      <div class="text-xs opacity-75">
                        {{ item.vote_count.toLocaleString() }} votos
                      </div>
                    </div>
                  </div>
                </div>

                <div class="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  #{{ index + 1 }}
                </div>
              </div>
              
              <div class="p-3">
                <h3 class="text-white font-semibold text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {{ getTitle(item) }}
                </h3>
                <p class="text-gray-400 text-xs mb-2">
                  {{ getReleaseYear(item) }}
                </p>
                
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-400 text-xs">⭐</span>
                    <span class="text-white text-xs font-medium">
                      {{ item.vote_average.toFixed(1) }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500">
                    {{ activeTab === 'movies' ? 'Pelicula' : 'Serie' }}
                  </span>
                </div>

                <button @click="handleWatchlistAction(item, activeTab)" :disabled="watchlistLoading[getItemKey(item.id, activeTab)]" :class="{'bg-red-600 hover:bg-red-700': isInWatchlist(item.id, activeTab), 'bg-purple-600 hover:bg-purple-700': !isInWatchlist(item.id, activeTab), 'opacity-50 cursor-not-allowed': watchlistLoading[getItemKey(item.id, activeTab)] }" class="w-full text-white px-2 py-1 rounded text-xs transition-colors">
                  <span v-if="watchlistLoading[getItemKey(item.id, activeTab)]">
                    Cargando...
                  </span>
                  <span v-else-if="isInWatchlist(item.id, activeTab)">
                    Eliminar
                  </span>
                  <span v-else>
                    ➕ Mi Lista
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="getCurrentItems().length > 4" class="flex justify-center mt-4 gap-2">
        <button v-for="(_, index) in Math.max(1, getCurrentItems().length - 3)" :key="index" @click="currentIndex = index" :class="['w-3 h-3 rounded-full transition-all', currentIndex === index ? 'bg-purple-500 scale-125' : 'bg-gray-600 hover:bg-gray-500']"/>
      </div>

      <div class="mt-6 bg-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-300">
            Mostrando contenido mejor valorado ({{ getCurrentItems().length }} elementos)
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 text-lg mb-4">
        No hay contenido disponible
      </div>
      <div class="text-gray-500 text-sm">
        Verifica la configuración de la API
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Movie, TVShow } from '../types/movies.ts';
import { tmdbApi } from '../lib/tmdb';

type TabType = 'movies' | 'series';
type WatchlistKey = string;

const activeTab = ref<TabType>('movies');
const currentIndex = ref(0);
const topMovies = ref<Movie[]>([]);
const topTVShows = ref<TVShow[]>([]);
const loading = ref(true);
const error = ref('');
const watchlistItems = ref<Set<WatchlistKey>>(new Set());
const watchlistLoading = ref<Record<WatchlistKey, boolean>>({});
const { watchlistStore } = await import('../lib/watchlistStore');

let storeUnsubscribe: (() => void) | null = null;

const getCurrentItems = () => 
  activeTab.value === 'movies' ? topMovies.value : topTVShows.value;

const getTitle = (item: Movie | TVShow) => 
  'title' in item ? item.title : item.name;

const getReleaseYear = (item: Movie | TVShow) => {
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  return date ? new Date(date).getFullYear().toString() : 'N/A';
};

const getItemKey = (id: number, type: TabType) =>
  `${id}-${type === 'movies' ? 'movie' : 'serie'}`;

const isInWatchlist = (id: number, type: TabType) =>
  watchlistItems.value.has(getItemKey(id, type));

const updateWatchlistState = async () => {
  try {
    const currentWatchlist = watchlistStore.getWatchlist();
    watchlistItems.value = new Set(
      currentWatchlist.map(item => `${item.id}-${item.type}`)
    );
  } catch (error) {
    alert('Error al actualizar el estado de la watchlist: '+ error);
  }
};

const handleWatchlistAction = async (item: Movie | TVShow, type: TabType) => {
  const itemKey = getItemKey(item.id, type);
  const normalizedType = type === 'movies' ? 'movie' : 'tv';
  
  try {
    watchlistLoading.value = { ...watchlistLoading.value, [itemKey]: true };
    const isAlreadyInWatchlist = watchlistStore.isInWatchlist(item.id, normalizedType);
    
    if (isAlreadyInWatchlist) {
      watchlistStore.removeFromWatchlist(item.id, normalizedType);
    } else {
      watchlistStore.addToWatchlist(item, normalizedType);
    }
  } catch (error) {
    alert('Error al actualizar la watchlist: ' + error);
  } finally {
    const newLoading = { ...watchlistLoading.value };
    delete newLoading[itemKey];
    watchlistLoading.value = newLoading;
  }
};

const switchTab = (tab: TabType) => {
  activeTab.value = tab;
  currentIndex.value = 0;
};

const nextSlide = () => {
  const items = getCurrentItems();
  if (items.length > 4) {
    currentIndex.value = (currentIndex.value + 1) % Math.max(1, items.length - 3);
  }
};

const prevSlide = () => {
  const items = getCurrentItems();
  if (items.length > 4) {
    currentIndex.value = (currentIndex.value - 1 + Math.max(1, items.length - 3)) % Math.max(1, items.length - 3);
  }
};

const fetchData = async () => {
  try {
    loading.value = true;
    error.value = '';
    
    const [moviesResponse, tvResponse] = await Promise.all([
      tmdbApi.getTopRatedMovies(),
      tmdbApi.getTopRatedTVShows()
    ]);
    
    topMovies.value = moviesResponse.results.slice(0, 8);
    topTVShows.value = tvResponse.results.slice(0, 8);
    
  } catch (err) {
    error.value = 'Error cargando contenido: ' + (err instanceof Error ? err.message : 'Error desconocido');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchData();
  await updateWatchlistState();

  try {
    const { watchlistStore } = await import('../lib/watchlistStore');
    storeUnsubscribe = watchlistStore.subscribe(() => {
      updateWatchlistState();
    });
  } catch (error) {
    // Error handling
  }
});
</script>
