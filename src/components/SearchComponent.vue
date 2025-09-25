<template>
  <div class="relative">
    <div class="flex items-center gap-2">
      <div class="relative">
        <input ref="searchInput" v-model="searchQuery" @input="handleSearch" @focus="showResults = true" @blur="handleBlur" type="text" placeholder="Buscar películas o series..." class="w-96 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-primary-500 text-sm pr-10"/>
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>
      </div>
      
      <div class="flex gap-1">
        <button
          @click="() => { searchType = 'movie'; handleSearch(); }"
          :class="[
            'px-3 py-2 rounded text-xs font-medium transition-colors',
            searchType === 'movie' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          Pelicula
        </button>
        <button
          @click="() => { searchType = 'tv'; handleSearch(); }"
          :class="[
            'px-3 py-2 rounded text-xs font-medium transition-colors',
            searchType === 'tv' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          ]"
        >
          Serie
        </button>
      </div>
    </div>

    <div v-if="showResults && (searchResults.length > 0 || searchQuery.trim().length > 0)" class="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto" style="width: 100%;" @mouseenter="preventBlur = true" @mouseleave="preventBlur = false">
      <div v-if="loading" class="p-4 text-center">
        <div class="text-primary-400 text-sm">Buscando...</div>
      </div>

      <div v-else-if="searchResults.length > 0" class="py-2">
        <div class="px-3 py-2 text-xs text-gray-400 border-b border-gray-700">
          {{ searchResults.length }} resultado{{ searchResults.length !== 1 ? 's' : '' }} para "{{ searchQuery }}"
        </div>
        
        <div v-for="item in searchResults.slice(0, 8)" :key="item.id" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0">
          <div class="flex-shrink-0">
            <img
              v-if="item.poster_path"
              :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`"
              :alt="getTitle(item)"
              class="w-10 h-14 object-cover rounded border border-gray-600"
            />
            <div 
              v-else 
              class="w-10 h-14 bg-gray-600 rounded flex items-center justify-center border border-gray-600"
            >
              <span class="text-lg">{{ searchType === 'movie' ? 'Pelicula' : 'Serie' }}</span>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-white text-sm truncate">
              {{ getTitle(item) }}
            </h4>
            <div class="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>{{ getReleaseYear(item) }}</span>
              <span>⭐{{ item.vote_average.toFixed(1) }}</span>
              <span>{{ searchType === 'movie' ? 'Pelicula' : 'Serie' }}</span>
            </div>
            <p v-if="item.overview" class="text-gray-300 text-xs line-clamp-1">
              {{ item.overview }}
            </p>
          </div>

          <div class="flex-shrink-0">
            <button :disabled="watchlistLoading[getItemKey(item.id, searchType)]" :class="{   'bg-red-500 hover:bg-red-600': isInWatchlist(item.id, searchType),   'bg-green-500 hover:bg-green-600': !isInWatchlist(item.id, searchType),   'opacity-50 cursor-not-allowed': watchlistLoading[getItemKey(item.id, searchType)] }" class="px-2 py-1 text-white rounded text-xs transition-colors font-medium" @mousedown.prevent="handleWatchlistAction(item, searchType)">
              <span v-if="watchlistLoading[getItemKey(item.id, searchType)]">
                ⏳
              </span>
              <span v-else-if="isInWatchlist(item.id, searchType)">
                ✓
              </span>
              <span v-else>
                ➕
              </span>
            </button>
          </div>
        </div>
        
        <div v-if="searchResults.length > 8" class="px-3 py-2 text-center border-t border-gray-700">
          <div class="text-xs text-gray-400">
            {{ searchResults.length - 8 }} resultado{{ searchResults.length - 8 !== 1 ? 's' : '' }} más...
          </div>
        </div>
      </div>

      <div v-else-if="searchQuery.trim() && !loading" class="p-4 text-center">
        <div class="text-gray-400 text-sm">No se encontraron resultados</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted} from 'vue'
import type { Movie, TVShow } from '../types/movies.ts'
import { tmdbApi } from '../lib/tmdb'

type SearchType = 'movie' | 'tv';
type WatchlistKey = string; 

const searchQuery = ref('')
const searchType = ref<SearchType>('movie')
const searchResults = ref<(Movie | TVShow)[]>([])
const loading = ref(false)
const showResults = ref(false)
const searchInput = ref<HTMLInputElement>()
const preventBlur = ref(false) 


const watchlistItems = ref<Set<WatchlistKey>>(new Set())
const watchlistLoading = ref<Record<WatchlistKey, boolean>>({})

const { watchlistStore } = await import('../lib/watchlistStore')


let searchTimeout: ReturnType<typeof setTimeout>
let storeUnsubscribe: (() => void) | null = null

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

const handleBlur = () => {
  setTimeout(() => {
    if (!preventBlur.value) {
      showResults.value = false
    }
  }, 150)
}

const updateWatchlistState = async (): Promise<void> => {
  try {
    
    const currentWatchlist = watchlistStore.getWatchlist()

    const newSet = new Set<WatchlistKey>()
    currentWatchlist.forEach(item => {
      newSet.add(`${item.id}-${item.type}`)
    })

    watchlistItems.value = newSet
    
  } catch (error) {
    alert('Vue SearchBar: Error updating watchlist state:' + error)
  }
}

const handleWatchlistAction = async (item: Movie | TVShow, type: SearchType): Promise<void> => {
  const itemKey = getItemKey(item.id, type)
  
  try {

    watchlistLoading.value = { ...watchlistLoading.value, [itemKey]: true }
    
    
    const isAlreadyInWatchlist = watchlistStore.isInWatchlist(item.id, type)
    
    if (isAlreadyInWatchlist) {
      watchlistStore.removeFromWatchlist(item.id, type)
    } else {
      watchlistStore.addToWatchlist(item, type)
    }
    
    showResults.value = true
    
    if (searchInput.value) {
      searchInput.value.focus()
    }
    
  } catch (error) {
    alert('Vue SearchBar: Error with watchlist action:' + error)
  } finally {
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
    
    searchResults.value = response.results.slice(0, 20) 

  } catch (error) {
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

  searchTimeout = setTimeout(performSearch, 300) 
}


onMounted(async () => {
  
  await updateWatchlistState()
  
  try {
    storeUnsubscribe = watchlistStore.subscribe(() => {
      updateWatchlistState()
    })
  } catch (error) {
    alert('Vue SearchBar: Error subscribing to store: '+ error)
  }
  
})

onUnmounted(() => {
 
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (storeUnsubscribe) {
    storeUnsubscribe()
  }
})


</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Scrollbar personalizado */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #374151;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 2px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>