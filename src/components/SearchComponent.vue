<template>
  <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4 text-primary-400">Buscar (Vue Component)</h2>
    
    <div class="flex gap-4 mb-6">
      <div class="flex-1">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          type="text"
          placeholder="Buscar películas o series..."
          class="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-primary-500"
        />
      </div>
      
      <div class="flex gap-2">
        <button
          @click="() => { searchType = 'movie'; handleSearch(); }"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            searchType === 'movie' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          Películas
        </button>
        <button
          @click="() => { searchType = 'tv'; handleSearch(); }"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            searchType === 'tv' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          Series
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="text-primary-400">Buscando...</div>
    </div>

    <div v-else-if="searchResults.length > 0" class="space-y-4">
      <div class="flex justify-between items-center">
        <h3 class="text-lg font-semibold">
          Resultados ({{ searchResults.length }})
        </h3>
        <a 
          href="/watchlist" 
          class="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-2"
        >
          Ver Watchlist
        </a>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in searchResults"
          :key="item.id"
          class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all duration-300 border border-gray-600 hover:border-gray-500"
        >
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <img
                v-if="item.poster_path"
                :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`"
                :alt="getTitle(item)"
                class="w-16 h-24 object-cover rounded border border-gray-600"
              />
              <div 
                v-else 
                class="w-16 h-24 bg-gray-600 rounded flex items-center justify-center border border-gray-600"
              >
                <span class="text-2xl">{{ searchType === 'movie' ? '🎬' : '📺' }}</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-white mb-1 text-sm">
                {{ getTitle(item) }}
              </h4>
              <p class="text-sm text-gray-400 mb-2">
                {{ getReleaseYear(item) }}
              </p>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                  <span class="text-primary-400 text-sm">
                    {{ item.vote_average.toFixed(1) }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ searchType === 'movie' ? '🎬' : '📺' }}
                  </span>
                </div>
              </div>
              
              <!-- Overview truncado -->
              <p v-if="item.overview" class="text-gray-300 text-xs mb-3 line-clamp-2">
                {{ item.overview }}
              </p>
              
              <!-- Botón watchlist dinámico -->
              <button
                @click="handleWatchlistAction(item, searchType)"
                :disabled="watchlistLoading[getItemKey(item.id, searchType)]"
                :class="{
                  'bg-red-600 hover:bg-red-700': isInWatchlist(item.id, searchType),
                  'bg-blue-600 hover:bg-blue-700': !isInWatchlist(item.id, searchType),
                  'opacity-50 cursor-not-allowed': watchlistLoading[getItemKey(item.id, searchType)]
                }"
                class="w-full text-white px-3 py-2 rounded text-sm transition-all font-medium"
              >
                <span v-if="watchlistLoading[getItemKey(item.id, searchType)]">
                  Cargando...
                </span>
                <span v-else-if="isInWatchlist(item.id, searchType)">
                  Eliminar de Watchlist
                </span>
                <span v-else>
                  ➕ Agregar a Watchlist
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Link a watchlist si hay items -->
      <div v-if="hasItemsInWatchlist" class="mt-6 bg-primary-900 bg-opacity-30 p-4 rounded-lg border border-primary-600">
        <div class="flex items-center justify-between">
          <div class="text-primary-300">
            <span class="text-sm font-medium">Tienes {{ watchlistItemsCount }} elementos en tu watchlist</span>
          </div>
          <a 
            href="/watchlist" 
            class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm transition-colors font-medium"
          >
            Ver Watchlist
          </a>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery && !loading" class="text-center py-8 text-gray-400">
      <div class="text-4xl mb-4"></div>
      <div class="text-lg mb-2">No se encontraron resultados</div>
      <div class="text-sm">Intenta con otros términos de búsqueda</div>
    </div>
    
    <!-- Estado inicial -->
    <div v-else class="text-center py-8 text-gray-400">
      <div class="text-4xl mb-4"></div>
      <div class="text-lg mb-2">¿Qué queres ver?</div>
      <div class="text-sm">Busca películas y series para agregarlas a tu watchlist</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Movie, TVShow } from '../types/movies.ts'
import { tmdbApi } from '../lib/tmdb'

// Tipos
type SearchType = 'movie' | 'tv';
type WatchlistKey = string; // formato: "id-type"

// Variables reactivas principales
const searchQuery = ref('')
const searchType = ref<SearchType>('movie')
const searchResults = ref<(Movie | TVShow)[]>([])
const loading = ref(false)

// Variables reactivas para watchlist
const watchlistItems = ref<Set<WatchlistKey>>(new Set())
const watchlistLoading = ref<Record<WatchlistKey, boolean>>({})

// Variables para cleanup
let searchTimeout: ReturnType<typeof setTimeout>
let storeUnsubscribe: (() => void) | null = null

// Computed
const hasItemsInWatchlist = computed(() => watchlistItems.value.size > 0)
const watchlistItemsCount = computed(() => watchlistItems.value.size)

// Funciones de utilidad
const getTitle = (item: Movie | TVShow): string => {
  return 'title' in item ? item.title : item.name
}

const getReleaseYear = (item: Movie | TVShow): string => {
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  return new Date(date).getFullYear().toString()
}

const getItemKey = (id: number, type: SearchType): WatchlistKey => {
  return `${id}-${type}`
}

const isInWatchlist = (id: number, type: SearchType): boolean => {
  return watchlistItems.value.has(getItemKey(id, type))
}

// Función para actualizar el estado de watchlist desde el store
const updateWatchlistState = async (): Promise<void> => {
  try {
    const { watchlistStore } = await import('../lib/watchlistStore')
    const currentWatchlist = watchlistStore.getWatchlist()
    
    // Crear nuevo Set con los IDs actuales
    const newSet = new Set<WatchlistKey>()
    currentWatchlist.forEach(item => {
      newSet.add(`${item.id}-${item.type}`)
    })
    
    watchlistItems.value = newSet
    console.log('Vue Search: Updated watchlist state, items:', newSet.size)
  } catch (error) {
    console.error('Vue Search: Error updating watchlist state:', error)
  }
}

// Función para manejar acciones de watchlist
const handleWatchlistAction = async (item: Movie | TVShow, type: SearchType): Promise<void> => {
  const itemKey = getItemKey(item.id, type)
  
  try {
    // Activar loading para este item específico
    watchlistLoading.value = { ...watchlistLoading.value, [itemKey]: true }
    
    console.log('Vue Search: Processing watchlist action for:', getTitle(item), type)
    
    // Importar dinámicamente el store
    const { watchlistStore } = await import('../lib/watchlistStore')
    
    // Verificar si ya está en la watchlist
    const isAlreadyInWatchlist = watchlistStore.isInWatchlist(item.id, type)
    
    let success = false
    if (isAlreadyInWatchlist) {
      // Remover de watchlist
      console.log('Vue Search: Removing from watchlist:', getTitle(item))
      success = watchlistStore.removeFromWatchlist(item.id, type)
      if (success) {
        console.log('Vue Search: Successfully removed:', getTitle(item))
      }
    } else {
      // Agregar a watchlist
      console.log('➕ Vue Search: Adding to watchlist:', getTitle(item))
      success = watchlistStore.addToWatchlist(item, type)
      if (success) {
        console.log('Vue Search: Successfully added:', getTitle(item))
      } else {
        console.log('Vue Search: Item already in watchlist:', getTitle(item))
      }
    }
    
    // El estado se actualizará automáticamente via suscripción al store
    
  } catch (error) {
    console.error('Vue Search: Error with watchlist action:', error)
  } finally {
    // Desactivar loading
    const newLoading = { ...watchlistLoading.value }
    delete newLoading[itemKey]
    watchlistLoading.value = newLoading
  }
}

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  loading.value = true
  
  try {
    const response = searchType.value === 'movie'
      ? await tmdbApi.searchMovies(searchQuery.value.trim())
      : await tmdbApi.searchTVShows(searchQuery.value.trim())
    
    searchResults.value = response.results.slice(0, 12)
    console.log('Vue Search: Found', searchResults.value.length, 'results')
  } catch (error) {
    console.error('Vue Search: Error searching:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  clearTimeout(searchTimeout)
  
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(performSearch, 500)
}

// Lifecycle hooks
onMounted(async () => {
  console.log('Vue Search: Component mounted')
  
  // Cargar estado inicial de watchlist
  await updateWatchlistState()
  
  // Suscribirse a cambios del store
  try {
    const { watchlistStore } = await import('../lib/watchlistStore')
    storeUnsubscribe = watchlistStore.subscribe(() => {
      console.log('Vue Search: Received store update notification')
      updateWatchlistState()
    })
    console.log('Vue Search: Successfully subscribed to watchlist store')
  } catch (error) {
    console.error('Vue Search: Error subscribing to store:', error)
  }
})

onUnmounted(() => {
  console.log('Vue Search: Component cleanup')
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (storeUnsubscribe) {
    storeUnsubscribe()
  }
})

// Watch para cambios en el tipo de búsqueda
import { watch } from 'vue'
watch(searchType, () => {
  if (searchQuery.value.trim()) {
    handleSearch()
  }
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>