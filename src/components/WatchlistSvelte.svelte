<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { WatchlistItem, WatchlistStats } from '../lib/watchlistStore';

  // Tipos
  type FilterType = 'all' | 'unwatched' | 'watched' | 'movie' | 'tv';
  type SortType = 'dateAdded' | 'rating' | 'title' | 'priority';

  // Estados principales
  let watchlist: WatchlistItem[] = [];
  let stats: WatchlistStats = {
    total: 0,
    watched: 0,
    unwatched: 0,
    movies: 0,
    tvShows: 0,
    avgRating: 0,
    watchedAvgRating: 0
  };

  // Estados de filtros
  let filter: FilterType = 'all';
  let sortBy: SortType = 'dateAdded';
  let isInitialized = false;

  // Variables para cleanup
  let unsubscribe: (() => void) | null = null;
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Computed para items filtrados
  $: filteredItems = (() => {
    let items = [...watchlist];
    
    console.log('Svelte: Filtering items:', {
      totalItems: items.length,
      filter: filter,
      items: items.map(i => ({ id: i.id, title: i.title, type: i.type, watched: i.isWatched }))
    });
    
    // Aplicar filtro
    switch (filter) {
      case 'watched':
        items = items.filter(item => item.isWatched);
        break;
      case 'unwatched':
        items = items.filter(item => !item.isWatched);
        break;
      case 'movie':
        items = items.filter(item => item.type === 'movie');
        break;
      case 'tv':
        items = items.filter(item => item.type === 'tv');
        break;
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case 'rating':
        items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'title':
        items.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        items.sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        });
        break;
      default:
        items.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
    }

    console.log('Svelte: Filtered result:', {
      filteredCount: items.length,
      filter: filter,
      sort: sortBy
    });

    return items;
  })();

  // Función para actualizar datos desde el store
  const updateFromStore = async (): Promise<void> => {
    try {
      const { watchlistStore } = await import('../lib/watchlistStore');
      const currentWatchlist = watchlistStore.getWatchlist();
      const currentStats = watchlistStore.getStats();
      
      console.log('Svelte: Updating from store:', {
        items: currentWatchlist.length,
        stats: currentStats
      });
      
      watchlist = [...currentWatchlist];
      stats = { ...currentStats };
      
      if (!isInitialized) {
        isInitialized = true;
      }
    } catch (error) {
      console.error('Svelte: Error updating from store:', error);
    }
  };

  // Actions
  const toggleWatched = async (id: number, type: 'movie' | 'tv'): Promise<void> => {
    try {
      console.log('Svelte: Toggling watched:', id, type);
      const { watchlistStore } = await import('../lib/watchlistStore');
      watchlistStore.toggleWatched(id, type);
    } catch (error) {
      console.error('Svelte: Error toggling watched:', error);
    }
  };

  const removeFromWatchlist = async (id: number, type: 'movie' | 'tv'): Promise<void> => {
    try {
      console.log('Svelte: Removing item:', id, type);
      const { watchlistStore } = await import('../lib/watchlistStore');
      watchlistStore.removeFromWatchlist(id, type);
    } catch (error) {
      console.error('Svelte: Error removing item:', error);
    }
  };

  const setPriority = async (id: number, type: 'movie' | 'tv', priority: 'high' | 'medium' | 'low'): Promise<void> => {
    try {
      console.log('Svelte: Setting priority:', id, type, priority);
      const { watchlistStore } = await import('../lib/watchlistStore');
      watchlistStore.setPriority(id, type, priority);
    } catch (error) {
      console.error('Svelte: Error setting priority:', error);
    }
  };

  const updateNotes = async (id: number, type: 'movie' | 'tv', notes: string): Promise<void> => {
    try {
      const { watchlistStore } = await import('../lib/watchlistStore');
      watchlistStore.updateNotes(id, type, notes);
    } catch (error) {
      console.error('Svelte: Error updating notes:', error);
    }
  };

  // Lifecycle
  onMount(async () => {
    console.log('Svelte: WatchlistSvelte component mounted');
    
    // 1. Cargar datos inmediatamente
    await updateFromStore();
    
    // 2. Importar y suscribirse al store
    try {
      const { watchlistStore } = await import('../lib/watchlistStore');
      
      unsubscribe = watchlistStore.subscribe((newWatchlist: WatchlistItem[], newStats: WatchlistStats) => {
        console.log('Svelte: Store subscription triggered:', {
          items: newWatchlist.length,
          stats: newStats
        });
        
        watchlist = [...newWatchlist];
        stats = { ...newStats };
      });

      console.log('Svelte: Successfully subscribed to store');
    } catch (error) {
      console.error('Svelte: Error subscribing to store:', error);
    }

    // 3. Escuchar eventos del storage
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'movieDashWatchlist') {
        console.log('Svelte: Storage changed, updating...');
        setTimeout(() => updateFromStore(), 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    // 4. Escuchar eventos personalizados
    const handleForceUpdate = (): void => {
      console.log('Svelte: Force update triggered');
      updateFromStore();
    };
    
    window.addEventListener('watchlist:forceUpdate', handleForceUpdate);

    // 5. Polling de seguridad
    refreshInterval = setInterval(() => {
      updateFromStore();
    }, 3000);

    // Cleanup en onDestroy
    onDestroy(() => {
      console.log('Svelte: Component cleanup');
      if (unsubscribe) unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('watchlist:forceUpdate', handleForceUpdate);
    });

    console.log('Svelte: Component fully initialized');
  });
</script>

<div class="bg-gradient-to-br from-green-900 via-teal-900 to-blue-900 p-6 rounded-lg shadow-lg">
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-green-300">
      Mi Watchlist (Svelte Component)
    </h2>
    
    <div class="flex gap-2">
      <select 
        bind:value={filter}
        on:change={() => console.log('Svelte: Filter changed to:', filter)}
        class="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600"
      >
        <option value="all">Todas ({stats.total})</option>
        <option value="unwatched">Sin ver ({stats.unwatched})</option>
        <option value="watched">Vistas ({stats.watched})</option>
        <option value="movie">Películas ({stats.movies})</option>
        <option value="tv">Series ({stats.tvShows})</option>
      </select>
      
      <select 
        bind:value={sortBy}
        on:change={() => console.log('Svelte: Sort changed to:', sortBy)}
        class="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600"
      >
        <option value="dateAdded">Fecha agregada</option>
        <option value="priority">Prioridad</option>
        <option value="rating">Rating</option>
        <option value="title">Título</option>
      </select>
    </div>
  </div>

  <!-- Stats Panel -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
      <div class="text-2xl font-bold text-green-300">{stats.total}</div>
      <div class="text-xs text-gray-300">Total</div>
    </div>
    
    <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
      <div class="text-2xl font-bold text-blue-300">{stats.watched}</div>
      <div class="text-xs text-gray-300">Vistas</div>
    </div>
    
    <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
      <div class="text-2xl font-bold text-yellow-300">{stats.unwatched}</div>
      <div class="text-xs text-gray-300">Pendientes</div>
    </div>
    
    <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
      <div class="text-2xl font-bold text-purple-300">{stats.avgRating.toFixed(1)}</div>
      <div class="text-xs text-gray-300">Promedio</div>
    </div>
    
    <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
      <div class="text-2xl font-bold text-pink-300">{stats.watchedAvgRating.toFixed(1)}</div>
      <div class="text-xs text-gray-300">Vistas</div>
    </div>
  </div>

  <!-- Content -->
  {#if isInitialized && filteredItems.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredItems as item (item.id + '-' + item.type)}
        <div class="bg-black bg-opacity-40 rounded-lg p-4 border-l-4 {item.isWatched ? 'border-green-500' : 'border-yellow-500'} transition-all hover:bg-opacity-60 border border-gray-700 hover:border-gray-500">
          <div class="flex gap-3">
            <div class="flex-shrink-0">
              {#if item.poster_path}
                <img
                  src="https://image.tmdb.org/t/p/w92{item.poster_path}"
                  alt={item.title}
                  class="w-16 h-24 object-cover rounded border border-gray-600"
                />
              {:else}
                <div class="w-16 h-24 bg-gray-600 rounded flex items-center justify-center">
                  <span class="text-2xl">{item.type === 'movie' ? '🎬' : '📺'}</span>
                </div>
              {/if}
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1 min-w-0">
                  <h3 class="text-white font-semibold text-sm mb-1 truncate">
                    {item.title}
                  </h3>
                  
                  <div class="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span>{item.year}</span>
                    <span>⭐{item.vote_average.toFixed(1)}</span>
                    <span>{item.type === 'movie' ? '🎬' : '📺'}</span>
                    <span class="{item.isWatched ? 'text-green-400' : 'text-yellow-400'}">
                      {item.isWatched ? '✓ Vista' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
              
              {#if item.overview}
                <p class="text-gray-300 text-xs mb-2 line-clamp-2">
                  {item.overview}
                </p>
              {/if}
              
              <div class="mb-3">
                <textarea 
                  placeholder="Agregar notas..." 
                  class="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 resize-none h-12 focus:border-green-500 focus:outline-none"
                  value={item.notes || ''}
                  on:blur={(e) => updateNotes(item.id, item.type, e.target.value)}
                />
              </div>
              
              <div class="flex items-center justify-between mb-2">
                <div class="text-xs text-gray-500">
                  Agregado: {new Date(item.dateAdded).toLocaleDateString()}
                  {#if item.dateWatched}
                    <span> • Visto: {new Date(item.dateWatched).toLocaleDateString()}</span>
                  {/if}
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  on:click={() => toggleWatched(item.id, item.type)}
                  class="px-2 py-1 rounded text-xs transition-all {item.isWatched ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white hover:scale-105"
                >
                  {item.isWatched ? '✓ Vista' : 'Marcar vista'}
                </button>
                
                <button
                  on:click={() => removeFromWatchlist(item.id, item.type)}
                  class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-all hover:scale-105"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-center py-12 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
      <div class="text-4xl mb-4">
        {#if !isInitialized}{:else if stats.total === 0}{:else}{/if}
      </div>
      <div class="text-gray-400 text-lg mb-4">
        {#if !isInitialized}
          Inicializando componente...
        {:else if stats.total === 0}
          Tu watchlist está vacía
        {:else}
          No hay elementos para el filtro seleccionado
        {/if}
      </div>
      <div class="text-gray-500 text-sm">
        {#if !isInitialized}
          Conectando con el store...
        {:else if stats.total === 0}
          Agrega películas y series usando el boton ➕
        {:else}
          Prueba cambiando el filtro o agregando más contenido
        {/if}
      </div>
    </div>
  {/if}

  <!-- Footer -->
  <div class="mt-6 pt-4 border-t border-gray-700">
    <div class="flex justify-between items-center text-sm">
      <div class="text-gray-300">
        {stats.movies} películas | {stats.tvShows} series | {stats.watched}/{stats.total} vistas
      </div>
      <div class="text-green-300 font-medium">
        Svelte Component
      </div>
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>