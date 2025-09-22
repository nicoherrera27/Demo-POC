<template>
  <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4 text-primary-400">🔍 Buscar (Vue Component)</h2>
    
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
          🎬 Películas
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
          📺 Series
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="text-primary-400">🔄 Buscando...</div>
    </div>

    <div v-else-if="searchResults.length > 0" class="space-y-4">
      <h3 class="text-lg font-semibold">
        Resultados ({{ searchResults.length }})
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in searchResults"
          :key="item.id"
          class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
        >
          <div class="flex gap-4">
            <img
              :src="`https://image.tmdb.org/t/p/w92${item.poster_path}`"
              :alt="getTitle(item)"
              class="w-16 h-24 object-cover rounded"
              v-if="item.poster_path"
            />
            <div class="flex-1">
              <h4 class="font-semibold text-white mb-1">
                {{ getTitle(item) }}
              </h4>
              <p class="text-sm text-gray-400 mb-2">
                📅 {{ getReleaseYear(item) }}
              </p>
              <div class="flex items-center justify-between">
                <span class="text-primary-400">
                  ⭐ {{ item.vote_average.toFixed(1) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ searchType === 'movie' ? '🎬' : '📺' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="searchQuery && !loading" class="text-center py-8 text-gray-400">
      ❌ No se encontraron resultados para "{{ searchQuery }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Movie, TVShow } from '../types/movies.ts'
import { tmdbApi } from '../lib/tmdb.js'

const searchQuery = ref('')
const searchType = ref<'movie' | 'tv'>('movie')
const searchResults = ref<(Movie | TVShow)[]>([])
const loading = ref(false)

let searchTimeout: ReturnType<typeof setTimeout>

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
  } catch (error) {
    console.error('Error searching:', error)
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

// Watch for search type changes
watch(searchType, () => {
  if (searchQuery.value.trim()) {
    handleSearch()
  }
})

const getTitle = (item: Movie | TVShow): string => {
  return 'title' in item ? item.title : item.name
}

const getReleaseYear = (item: Movie | TVShow): string => {
  const date = 'release_date' in item ? item.release_date : item.first_air_date
  return new Date(date).getFullYear().toString()
}
</script>