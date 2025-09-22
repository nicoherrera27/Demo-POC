import { createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import type { Movie, TVShow } from '../types/movies.ts';
import { watchlistStore, type WatchlistItem, type WatchlistStats } from '../lib/watchlistStore';

export default function WatchlistSolid() {
  const [watchlist, setWatchlist] = createSignal<WatchlistItem[]>([]);
  const [stats, setStats] = createSignal<WatchlistStats>({
    total: 0,
    watched: 0,
    unwatched: 0,
    movies: 0,
    tvShows: 0,
    avgRating: 0,
    watchedAvgRating: 0
  });
  const [filter, setFilter] = createSignal<'all' | 'unwatched' | 'watched' | 'movie' | 'tv'>('all');
  const [sortBy, setSortBy] = createSignal<'dateAdded' | 'rating' | 'title' | 'priority'>('dateAdded');

  let unsubscribe: (() => void) | null = null;

  // Computed values para filtrado y ordenado
  const filteredItems = createMemo(() => {
    let items = [...watchlist()];
    
    console.log('🔍 SolidJS: Filtering items, total:', items.length, 'filter:', filter());
    
    // Apply filter
    switch (filter()) {
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

    // Apply sorting
    switch (sortBy()) {
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
      case 'dateAdded':
      default:
        items.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
    }

    console.log('📋 SolidJS: Filtered items:', items.length);
    return items;
  });

  // Actions
  const toggleWatched = (id: number, type: 'movie' | 'tv') => {
    watchlistStore.toggleWatched(id, type);
  };

  const removeFromWatchlist = (id: number, type: 'movie' | 'tv') => {
    watchlistStore.removeFromWatchlist(id, type);
  };

  const setPriority = (id: number, type: 'movie' | 'tv', priority: 'high' | 'medium' | 'low') => {
    watchlistStore.setPriority(id, type, priority);
  };

  const updateNotes = (id: number, type: 'movie' | 'tv', notes: string) => {
    watchlistStore.updateNotes(id, type, notes);
  };

  // Lifecycle
  onMount(() => {
    console.log('🚀 SolidJS WatchlistSolid component mounted');
    
    // Cargar datos inmediatamente desde el store
    const loadInitialData = () => {
      const currentWatchlist = watchlistStore.getWatchlist();
      const currentStats = watchlistStore.getStats();
      
      console.log('📊 SolidJS: Loading initial data:', {
        total: currentStats.total,
        items: currentWatchlist.length,
        watchlist: currentWatchlist.map(i => ({ id: i.id, title: i.title, type: i.type }))
      });
      
      setWatchlist([...currentWatchlist]);
      setStats({ ...currentStats });
    };
    
    // Cargar datos inmediatamente
    loadInitialData();

    // Suscribirse a cambios futuros
    unsubscribe = watchlistStore.subscribe((newWatchlist: WatchlistItem[], newStats: WatchlistStats) => {
      console.log('🔄 SolidJS: Store updated via subscription:', {
        total: newStats.total,
        items: newWatchlist.length
      });
      setWatchlist([...newWatchlist]);
      setStats({ ...newStats });
    });

    // También escuchar eventos del storage por si hay cambios en otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'movieDashWatchlist') {
        console.log('🔄 SolidJS: Storage changed, reloading data');
        loadInitialData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup para el evento de storage
    const originalCleanup = unsubscribe;
    unsubscribe = () => {
      if (originalCleanup) originalCleanup();
      window.removeEventListener('storage', handleStorageChange);
    };

    console.log('✅ SolidJS: Successfully connected to watchlist store');
  });

  onCleanup(() => {
    console.log('🧹 SolidJS WatchlistSolid component cleanup');
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
            onInput={(e) => setFilter(e.target.value as any)}
            class="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="all">Todas ({stats().total})</option>
            <option value="unwatched">Sin ver ({stats().unwatched})</option>
            <option value="watched">Vistas ({stats().watched})</option>
            <option value="movie">🎬 Películas ({stats().movies})</option>
            <option value="tv">📺 Series ({stats().tvShows})</option>
          </select>
          
          <select 
            value={sortBy()}
            onInput={(e) => setSortBy(e.target.value as any)}
            class="bg-gray-700 text-white px-3 py-1 rounded text-sm"
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
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-300">{stats().total}</div>
          <div class="text-xs text-gray-300">Total</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-300">{stats().watched}</div>
          <div class="text-xs text-gray-300">Vistas</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-yellow-300">{stats().unwatched}</div>
          <div class="text-xs text-gray-300">Pendientes</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-300">{stats().avgRating.toFixed(1)}</div>
          <div class="text-xs text-gray-300">★ Promedio</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-pink-300">{stats().watchedAvgRating.toFixed(1)}</div>
          <div class="text-xs text-gray-300">★ Vistas</div>
        </div>
      </div>

      {/* Debug Panel (solo desarrollo) */}
      <div class="mb-4 p-3 bg-gray-800 bg-opacity-50 rounded text-xs text-gray-400 border border-gray-600">
        🔍 Debug: Total items: {stats().total}, Filtered: {filteredItems().length}, Filter: {filter()}, Sort: {sortBy()}<br/>
        Raw watchlist: {JSON.stringify(watchlist().map(i => ({ id: i.id, title: i.title, type: i.type })))}
      </div>

      {/* Content */}
      <Show 
        when={filteredItems().length > 0} 
        fallback={
          <div class="text-center py-12">
            <div class="text-4xl mb-4">
              {stats().total === 0 ? "📭" : "🔍"}
            </div>
            <div class="text-gray-400 text-lg mb-4">
              {stats().total === 0 
                ? "Tu watchlist está vacía" 
                : `No hay elementos para el filtro "${filter()}"`}
            </div>
            <div class="text-gray-500 text-sm">
              {stats().total === 0 
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
              } transition-all hover:bg-opacity-60 border border-gray-700`}>
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
                        class="w-16 h-24 object-cover rounded"
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
                        onchange={(e) => setPriority(item.id, item.type, e.target.value as any)} 
                        class="bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600"
                      >
                        <option value="low">🟢 Baja</option>
                        <option value="medium">⚡ Media</option>
                        <option value="high">🔥 Alta</option>
                      </select>
                    </div>
                    
                    <div class="mb-3">
                      <textarea 
                        placeholder="Agregar notas..." 
                        class="w-full bg-gray-700 text-white text-xs rounded px-2 py-1 border border-gray-600 resize-none h-12"
                        value={item.notes || ''}
                        onblur={(e) => updateNotes(item.id, item.type, e.target.value)}
                      />
                    </div>
                    
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-gray-500">
                        Agregado: {new Date(item.dateAdded).toLocaleDateString()}
                        {item.dateWatched && (
                          <span> • Visto: {new Date(item.dateWatched).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div class="flex gap-2 mt-2">
                      <button
                        onClick={() => toggleWatched(item.id, item.type)}
                        class={`px-2 py-1 rounded text-xs transition-colors ${
                          item.isWatched 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        }`}
                      >
                        {item.isWatched ? '✓ Vista' : '👁 Marcar vista'}
                      </button>
                      
                      <button
                        onClick={() => removeFromWatchlist(item.id, item.type)}
                        class="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
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
            {stats().total > 0 && (
              <span class="ml-4 text-xs text-gray-500">
                Promedio: ⭐{stats().avgRating.toFixed(1)} • Vistas: ⭐{stats().watchedAvgRating.toFixed(1)}
              </span>
            )}
          </div>
          <div class="text-blue-300 font-medium">
            Solid.js Component • Estado global compartido
          </div>
        </div>
      </div>
    </div>
  );
}