import { createSignal, createMemo, onMount, onCleanup, For, Show, createEffect } from 'solid-js';
import type { Movie, TVShow } from '../types/movies';
import { watchlistStore, type WatchlistItem, type WatchlistStats } from '../lib/watchlistStore';

type FilterType = 'all' | 'unwatched' | 'watched' | 'movie' | 'tv';
type SortType = 'dateAdded' | 'rating' | 'title' | 'priority';

export default function WatchlistSolid() {
  // Estados principales
  const [watchlist, setWatchlist] = createSignal<WatchlistItem[]>([], { equals: false });
  const [stats, setStats] = createSignal<WatchlistStats>({
    total: 0,
    watched: 0,
    unwatched: 0,
    movies: 0,
    tvShows: 0,
    avgRating: 0,
    watchedAvgRating: 0
  });
  
  // Estados de filtros
  const [filter, setFilter] = createSignal<FilterType>('all');
  const [sortBy, setSortBy] = createSignal<SortType>('dateAdded');
  const [isInitialized, setIsInitialized] = createSignal(false);

  let unsubscribe: (() => void) | null = null;
  let refreshInterval: ReturnType<typeof setInterval> | null = null;

  // Función para actualizar datos desde el store
  const updateFromStore = (): void => {
    try {
      const currentWatchlist = watchlistStore.getWatchlist();
      const currentStats = watchlistStore.getStats();
      
      console.log('🔄 SolidJS: Updating from store:', {
        items: currentWatchlist.length,
        stats: currentStats,
        watchlist: currentWatchlist.map(i => ({ id: i.id, title: i.title, type: i.type }))
      });
      
      // Forzar actualización creando nuevas referencias
      setWatchlist([...currentWatchlist]);
      setStats({ ...currentStats });
      
      if (!isInitialized()) {
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('❌ SolidJS: Error updating from store:', error);
    }
  };

  // Computed para items filtrados
  const filteredItems = createMemo(() => {
    const items = [...watchlist()];
    const currentFilter = filter();
    
    console.log('🔍 SolidJS: Filtering items:', {
      totalItems: items.length,
      filter: currentFilter,
      items: items.map(i => ({ id: i.id, title: i.title, type: i.type, watched: i.isWatched }))
    });
    
    let filtered: WatchlistItem[] = [];
    
    // Aplicar filtro
    switch (currentFilter) {
      case 'watched':
        filtered = items.filter(item => item.isWatched);
        break;
      case 'unwatched':
        filtered = items.filter(item => !item.isWatched);
        break;
      case 'movie':
        filtered = items.filter(item => item.type === 'movie');
        break;
      case 'tv':
        filtered = items.filter(item => item.type === 'tv');
        break;
      default:
        filtered = items;
        break;
    }

    // Aplicar ordenamiento
    const currentSort = sortBy();
    switch (currentSort) {
      case 'rating':
        filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort((a, b) => {
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        });
        break;
      case 'dateAdded':
      default:
        filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
    }

    console.log('✅ SolidJS: Filtered result:', {
      filteredCount: filtered.length,
      filter: currentFilter,
      sort: currentSort
    });

    return filtered;
  });

  // Effect para detectar cambios en filtros
  createEffect(() => {
    const currentFilter = filter();
    const currentSort = sortBy();
    console.log('🎛️ SolidJS: Filter/Sort changed:', { filter: currentFilter, sort: currentSort });
  });

  // Actions
  const toggleWatched = (id: number, type: 'movie' | 'tv'): void => {
    console.log('👁️ SolidJS: Toggling watched:', id, type);
    watchlistStore.toggleWatched(id, type);
  };

  const removeFromWatchlist = (id: number, type: 'movie' | 'tv'): void => {
    console.log('🗑️ SolidJS: Removing item:', id, type);
    watchlistStore.removeFromWatchlist(id, type);
  };

  const setPriority = (id: number, type: 'movie' | 'tv', priority: 'high' | 'medium' | 'low'): void => {
    console.log('🎯 SolidJS: Setting priority:', id, type, priority);
    watchlistStore.setPriority(id, type, priority);
  };

  const updateNotes = (id: number, type: 'movie' | 'tv', notes: string): void => {
    watchlistStore.updateNotes(id, type, notes);
  };

  // Lifecycle
  onMount(() => {
    console.log('🚀 SolidJS: WatchlistSolid component mounted');
    
    // 1. Cargar datos inmediatamente
    updateFromStore();
    
    // 2. Suscribirse a cambios del store
    unsubscribe = watchlistStore.subscribe((newWatchlist: WatchlistItem[], newStats: WatchlistStats) => {
      console.log('📡 SolidJS: Store subscription triggered:', {
        items: newWatchlist.length,
        stats: newStats
      });
      
      // Usar batch para optimizar actualizaciones
      setWatchlist([...newWatchlist]);
      setStats({ ...newStats });
    });

    // 3. Escuchar eventos del storage para sincronización
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key === 'movieDashWatchlist') {
        console.log('💾 SolidJS: Storage changed, updating...');
        setTimeout(updateFromStore, 100);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    // 4. Escuchar eventos personalizados
    const handleForceUpdate = (): void => {
      console.log('🔄 SolidJS: Force update triggered');
      updateFromStore();
    };
    
    window.addEventListener('watchlist:forceUpdate', handleForceUpdate);

    // 5. Polling de seguridad cada 2 segundos
    refreshInterval = setInterval(() => {
      const currentData = watchlistStore.getWatchlist();
      if (currentData.length !== watchlist().length) {
        console.log('⏰ SolidJS: Polling detected change, updating...');
        updateFromStore();
      }
    }, 2000);

    // Cleanup function
    const originalCleanup = unsubscribe;
    unsubscribe = () => {
      console.log('🧹 SolidJS: Cleaning up subscriptions');
      if (originalCleanup) originalCleanup();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('watchlist:forceUpdate', handleForceUpdate);
      if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    };

    console.log('✅ SolidJS: Component fully initialized');
  });

  onCleanup(() => {
    console.log('🧹 SolidJS: Component cleanup');
    if (unsubscribe) {
      unsubscribe();
    }
  });

  return (
    <div class="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-6 rounded-lg shadow-lg">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-blue-300">
          📋 Mi Watchlist (Solid Component)
        </h2>
        
        <div class="flex gap-2">
          <select 
            value={filter()}
            onInput={(e) => {
              const newFilter = (e.target as HTMLSelectElement).value as FilterType;
              console.log('🎛️ SolidJS: Changing filter to:', newFilter);
              setFilter(newFilter);
            }}
            class="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600"
          >
            <option value="all">Todas ({stats().total})</option>
            <option value="unwatched">Sin ver ({stats().unwatched})</option>
            <option value="watched">Vistas ({stats().watched})</option>
            <option value="movie">🎬 Películas ({stats().movies})</option>
            <option value="tv">📺 Series ({stats().tvShows})</option>
          </select>
          
          <select 
            value={sortBy()}
            onInput={(e) => {
              const newSort = (e.target as HTMLSelectElement).value as SortType;
              console.log('🎛️ SolidJS: Changing sort to:', newSort);
              setSortBy(newSort);
            }}
            class="bg-gray-700 text-white px-3 py-1 rounded text-sm border border-gray-600"
          >
            <option value="dateAdded">Fecha agregada</option>
            <option value="priority">Prioridad</option>
            <option value="rating">Rating</option>
            <option value="title">Título</option>
          </select>
        </div>
      </div>

      {/* Stats Panel */}
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
          <div class="text-2xl font-bold text-blue-300">{stats().total}</div>
          <div class="text-xs text-gray-300">Total</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
          <div class="text-2xl font-bold text-green-300">{stats().watched}</div>
          <div class="text-xs text-gray-300">Vistas</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
          <div class="text-2xl font-bold text-yellow-300">{stats().unwatched}</div>
          <div class="text-xs text-gray-300">Pendientes</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
          <div class="text-2xl font-bold text-purple-300">{stats().avgRating.toFixed(1)}</div>
          <div class="text-xs text-gray-300">★ Promedio</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center border border-gray-700">
          <div class="text-2xl font-bold text-pink-300">{stats().watchedAvgRating.toFixed(1)}</div>
          <div class="text-xs text-gray-300">★ Vistas</div>
        </div>
      </div>

      {/* Debug Panel */}
      <div class="mb-4 p-3 bg-gray-800 bg-opacity-50 rounded text-xs text-gray-400 border border-gray-600 font-mono">
        🔍 Debug: Total: {stats().total}, Filtered: {filteredItems().length}, Filter: {filter()}, Sort: {sortBy()}, Initialized: {isInitialized() ? 'Yes' : 'No'}<br/>
        Raw items: {watchlist().map(i => `${i.title}(${i.type})`).join(', ')}<br/>
        Filtered IDs: {filteredItems().map(i => `${i.id}-${i.type}`).join(', ')}
      </div>

      {/* Content */}
      <Show 
        when={isInitialized() && filteredItems().length > 0} 
        fallback={
          <div class="text-center py-12 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
            <div class="text-4xl mb-4">
              {!isInitialized() ? "⏳" : stats().total === 0 ? "📭" : "🔍"}
            </div>
            <div class="text-gray-400 text-lg mb-4">
              {!isInitialized() 
                ? "Inicializando componente..." 
                : stats().total === 0 
                  ? "Tu watchlist está vacía" 
                  : `No hay elementos para el filtro "${filter()}"`}
            </div>
            <div class="text-gray-500 text-sm">
              {!isInitialized() 
                ? "Conectando con el store..." 
                : stats().total === 0 
                  ? "Agrega películas y series usando los botones ➕ en otros componentes"
                  : "Prueba cambiando el filtro o agregando más contenido"}
            </div>
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={filteredItems()}>
            {(item) => (
              <div class={`bg-black bg-opacity-40 rounded-lg p-4 border-l-4 ${
                item.isWatched ? 'border-green-500' : 'border-yellow-500'
              } transition-all hover:bg-opacity-60 border border-gray-700 hover:border-gray-500`}>
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <Show 
                      when={item.poster_path}
                      fallback={
                        <div class="w-16 h-24 bg-gray-600 rounded flex items-center justify-center">
                          <span class="text-2xl">{item.type === 'movie' ? '🎬' : '📺'}</span>
                        </div>
                      }
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title}
                        class="w-16 h-24 object-cover rounded border border-gray-600"
                      />
                    </Show>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1 min-w-0">
                        <h3 class="text-white font-semibold text-sm mb-1 truncate">
                          {item.title}
                        </h3>
                        
                        <div class="flex items-center gap-3 text-xs text-gray-400 mb-2">
                          <span>📅 {item.year}</span>
                          <span>⭐ {item.vote_average.toFixed(1)}</span>
                          <span>{item.type === 'movie' ? '🎬' : '📺'}</span>
                          <span class={item.isWatched ? 'text-green-400' : 'text-yellow-400'}>
                            {item.isWatched ? '✓ Vista' : '⏳ Pendiente'}
                          </span>
                        </div>
                      </div>
                      
                      <select 
                        value={item.priority}
                        onchange={(e) => setPriority(item.id, item.type, (e.target as HTMLSelectElement).value as 'high' | 'medium' | 'low')} 
                        class="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
                      >
                        <option value="low">🟢 Baja</option>
                        <option value="medium">⚡ Media</option>
                        <option value="high">🔥 Alta</option>
                      </select>
                    </div>
                    
                    <Show when={item.overview}>
                      <p class="text-gray-300 text-xs mb-2 line-clamp-2">
                        {item.overview}
                      </p>
                    </Show>
                    
                    <div class="mb-3">
                      <textarea 
                        placeholder="Agregar notas..." 
                        class="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 resize-none h-12 focus:border-blue-500 focus:outline-none"
                        value={item.notes || ''}
                        onblur={(e) => updateNotes(item.id, item.type, (e.target as HTMLTextAreaElement).value)}
                      />
                    </div>
                    
                    <div class="flex items-center justify-between mb-2">
                      <div class="text-xs text-gray-500">
                        Agregado: {new Date(item.dateAdded).toLocaleDateString()}
                        {item.dateWatched && (
                          <span> • Visto: {new Date(item.dateWatched).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div class="flex gap-2">
                      <button
                        onClick={() => toggleWatched(item.id, item.type)}
                        class={`px-2 py-1 rounded text-xs transition-all ${
                          item.isWatched 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        } hover:scale-105`}
                      >
                        {item.isWatched ? '✓ Vista' : '👁 Marcar vista'}
                      </button>
                      
                      <button
                        onClick={() => removeFromWatchlist(item.id, item.type)}
                        class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-all hover:scale-105"
                      >
                        🗑 Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Footer */}
      <div class="mt-6 pt-4 border-t border-gray-700">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-300">
            📊 {stats().movies} películas • {stats().tvShows} series • {stats().watched}/{stats().total} vistas
            <Show when={stats().total > 0}>
              <span class="ml-4 text-xs text-gray-500">
                Promedio: ⭐{stats().avgRating.toFixed(1)} • Vistas: ⭐{stats().watchedAvgRating.toFixed(1)}
              </span>
            </Show>
          </div>
          <div class="text-blue-300 font-medium">
            Solid.js Component • Estado global compartido • TS
          </div>
        </div>
      </div>
    </div>
  );
}