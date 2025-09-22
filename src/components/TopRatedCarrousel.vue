<template>
  <div class="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 rounded-lg shadow-lg">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-purple-400">
        🏆 Mejor Valorados (Vue Component)
      </h2>
      
      <div class="flex gap-2">
        <button
          @click="switchTab('movies')"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'movies' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          🎬 Películas ({{ topMovies.length }})
        </button>
        <button
          @click="switchTab('tv')"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'tv' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          📺 Series ({{ topTVShows.length }})
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="text-purple-400 text-lg mb-2">
        🔄 Cargando contenido mejor valorado...
      </div>
      <div class="text-gray-400 text-sm">
        Conectando con TMDB API
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-400 text-lg mb-4">
        ❌ {{ error }}
      </div>
      <button 
        @click="fetchData"
        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        🔄 Reintentar
      </button>
    </div>

    <!-- Content State -->
    <div v-else-if="getCurrentItems().length > 0" class="relative">
      <!-- Navigation Buttons -->
      <template v-if="getCurrentItems().length > 4">
        <button
          @click="prevSlide"
          class="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
        >
          ◀
        </button>
        
        <button
          @click="nextSlide"
          class="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
        >
          ▶
        </button>
      </template>

      <!-- Carousel -->
      <div class="overflow-hidden rounded-lg">
        <div 
          class="flex transition-transform duration-500 ease-in-out"
          :style="`transform: translateX(-${currentIndex * 25}%)`"
        >
          <div
            v-for="(item, index) in getCurrentItems()"
            :key="item.id"
            class="flex-shrink-0 w-1/4 p-2"
          >
            <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div class="relative group">
                <img
                  v-if="item.poster_path"
                  :src="`https://image.tmdb.org/t/p/w500${item.poster_path}`"
                  :alt="getTitle(item)"
                  class="w-full h-56 object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="w-full h-56 bg-gray-600 flex items-center justify-center"
                >
                  <div class="text-center">
                    <div class="text-gray-400 text-2xl mb-2">🎬</div>
                    <span class="text-gray-400 text-sm">Sin imagen</span>
                  </div>
                </div>
                
                <!-- Overlay with rating -->
                <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div class="absolute bottom-2 left-2 right-2">
                    <div class="text-white text-sm">
                      <div class="font-bold mb-1">
                        ⭐ {{ item.vote_average.toFixed(1) }}
                      </div>
                      <div class="text-xs opacity-75">
                        👥 {{ item.vote_count.toLocaleString() }} votos
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Rank badge -->
                <div class="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                  #{{ index + 1 }}
                </div>
              </div>
              
              <div class="p-3">
                <h3 class="text-white font-semibold text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {{ getTitle(item) }}
                </h3>
                <p class="text-gray-400 text-xs mb-2">
                  📅 {{ getReleaseYear(item) }}
                </p>
                
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-400 text-xs">⭐</span>
                    <span class="text-white text-xs font-medium">
                      {{ item.vote_average.toFixed(1) }}
                    </span>
                  </div>
                  <span class="text-xs text-gray-500">
                    {{ activeTab === 'movies' ? '🎬' : '📺' }}
                  </span>
                </div>

                <!-- Botón watchlist -->
                <button
                  @click="addToWatchlist(item, activeTab)"
                  class="w-full bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
                >
                  ➕ Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress indicators -->
      <div v-if="getCurrentItems().length > 4" class="flex justify-center mt-4 gap-2">
        <button
          v-for="(_, index) in Math.max(1, getCurrentItems().length - 3)"
          :key="index"
          @click="currentIndex = index"
          :class="[
            'w-3 h-3 rounded-full transition-all',
            currentIndex === index
              ? 'bg-purple-500 scale-125'
              : 'bg-gray-600 hover:bg-gray-500'
          ]"
        />
      </div>

      <!-- Stats bar -->
      <div class="mt-6 bg-gray-700 rounded-lg p-4">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-300">
            📊 Mostrando contenido mejor valorado ({{ getCurrentItems().length }} elementos)
          </div>
          <div class="text-purple-400 font-medium">
            {{ activeTab === 'movies' ? '🎬 Películas' : '📺 Series' }} • Vue.js Component
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="text-gray-400 text-lg mb-4">
        📭 No hay contenido disponible
      </div>
      <div class="text-gray-500 text-sm">
        Verifica la configuración de la API
      </div>
    </div>

    <!-- Debug Panel (solo desarrollo) -->
     <!--<div v-if="isDev" class="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-400 font-mono">
      🔍 Debug: loading={{ loading }}, error={{ error || 'none' }}, 
      movies={{ topMovies.length }}, tv={{ topTVShows.length }}, 
      activeTab={{ activeTab }}, currentItems={{ getCurrentItems().length }}
    </div>-->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Movie, TVShow } from '../types/movies.ts';
import { tmdbApi } from '../lib/tmdb';

const activeTab = ref<'movies' | 'tv'>('movies');
const currentIndex = ref(0);
const topMovies = ref<Movie[]>([]);
const topTVShows = ref<TVShow[]>([]);
const loading = ref(true);
const error = ref('');

// Computed para detectar si estamos en desarrollo
const isDev = computed(() => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost';
});

// Función para obtener items actuales
const getCurrentItems = () => {
  return activeTab.value === 'movies' ? topMovies.value : topTVShows.value;
};

// Función para obtener título
const getTitle = (item: Movie | TVShow): string => {
  return 'title' in item ? item.title : item.name;
};

// Función para obtener año
const getReleaseYear = (item: Movie | TVShow): string => {
  const date = 'release_date' in item ? item.release_date : item.first_air_date;
  return date ? new Date(date).getFullYear().toString() : 'N/A';
};

// Función para cambiar tab
const switchTab = (tab: 'movies' | 'tv') => {
  console.log('🔄 Cambiando tab a:', tab);
  activeTab.value = tab;
  currentIndex.value = 0;
};

// Función para slide siguiente
const nextSlide = () => {
  const items = getCurrentItems();
  if (items.length > 4) {
    currentIndex.value = (currentIndex.value + 1) % Math.max(1, items.length - 3);
  }
};

// Función para slide anterior
const prevSlide = () => {
  const items = getCurrentItems();
  if (items.length > 4) {
    currentIndex.value = (currentIndex.value - 1 + Math.max(1, items.length - 3)) % Math.max(1, items.length - 3);
  }
};

// Función para agregar a watchlist
const addToWatchlist = (item: Movie | TVShow, type: 'movies' | 'tv') => {
  const watchlistType = type === 'movies' ? 'movie' : 'tv';
  const event = new CustomEvent('addToWatchlist', {
    detail: { item, type: watchlistType }
  });
  window.dispatchEvent(event);
  
  // Feedback visual
  console.log(`✅ Vue: Agregado a watchlist - ${getTitle(item)} (${watchlistType})`);
};
const fetchData = async () => {
  console.log('🚀 Vue: Iniciando carga de datos...');
  
  try {
    loading.value = true;
    error.value = '';
    
    const [moviesResponse, tvResponse] = await Promise.all([
      tmdbApi.getTopRatedMovies(),
      tmdbApi.getTopRatedTVShows()
    ]);
    
    console.log('📊 Vue: Respuestas recibidas:', {
      movies: moviesResponse.results?.length || 0,
      tv: tvResponse.results?.length || 0
    });
    
    topMovies.value = moviesResponse.results.slice(0, 8);
    topTVShows.value = tvResponse.results.slice(0, 8);
    
    console.log('✅ Vue: Datos guardados:', {
      movies: topMovies.value.length,
      tv: topTVShows.value.length
    });
    
  } catch (err) {
    console.error('❌ Vue: Error loading top rated content:', err);
    error.value = 'Error cargando contenido: ' + (err instanceof Error ? err.message : 'Error desconocido');
  } finally {
    loading.value = false;
  }
};

// Hook de montaje
onMounted(async () => {
  console.log('🚀 Vue: Componente TopRatedVue montado');
  
  await fetchData();
  
  // Auto-scroll cada 5 segundos
  const interval = setInterval(() => {
    if (!loading.value && getCurrentItems().length > 0) {
      nextSlide();
    }
  }, 5000);
  
  // Cleanup se maneja automáticamente en Vue
  return () => {
    console.log('🧹 Vue: Limpiando TopRatedVue');
    clearInterval(interval);
  };
});
</script>