import { createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import type { Movie, TVShow } from '../types/movies.ts';

export interface WatchlistItem extends Movie {
  type: 'movie';
  dateAdded: string;
  isWatched: boolean;
}

export interface WatchlistTVItem extends TVShow {
  type: 'tv';
  dateAdded: string;
  isWatched: boolean;
}

export type WatchlistEntry = WatchlistItem | WatchlistTVItem;

// Store global de la watchlist (simulando un estado compartido)
const [watchlist, setWatchlist] = createSignal<WatchlistEntry[]>([]);

// Función para agregar a watchlist (exportada para usar en otros componentes)
export const addToWatchlist = (item: Movie | TVShow, type: 'movie' | 'tv') => {
  const watchlistItem: WatchlistEntry = {
    ...item,
    type,
    dateAdded: new Date().toISOString(),
    isWatched: false
  } as WatchlistEntry;

  setWatchlist(prev => {
    const exists = prev.find(w => w.id === item.id && w.type === type);
    if (exists) return prev;
    return [...prev, watchlistItem];
  });
};

// Función para verificar si está en watchlist
export const isInWatchlist = (id: number, type: 'movie' | 'tv'): boolean => {
  return watchlist().some(item => item.id === id && item.type === type);
};

export default function WatchlistSolid() {
  const [filter, setFilter] = createSignal<'all' | 'unwatched' | 'watched'>('all');
  const [sortBy, setSortBy] = createSignal<'dateAdded' | 'rating' | 'title'>('dateAdded');

  // Computed values
  const filteredItems = createMemo(() => {
    let items = [...watchlist()];
    
    // Filter
    switch (filter()) {
      case 'watched':
        items = items.filter(item => item.isWatched);
        break;
      case 'unwatched':
        items = items.filter(item => !item.isWatched);
        break;
    }

    // Sort
    switch (sortBy()) {
      case 'rating':
        items.sort((a, b) => b.vote_average - a.vote_average);
        break;
      case 'title':
        items.sort((a, b) => getTitle(a).localeCompare(getTitle(b)));
        break;
      case 'dateAdded':
      default:
        items.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
    }

    return items;
  });

  const stats = createMemo(() => {
    const items = watchlist();
    const total = items.length;
    const watched = items.filter(item => item.isWatched).length;
    const unwatched = total - watched;
    const avgRating = items.length > 0 
      ? items.reduce((sum, item) => sum + item.vote_average, 0) / items.length 
      : 0;
    
    const watchedAvgRating = watched > 0
      ? items.filter(item => item.isWatched).reduce((sum, item) => sum + item.vote_average, 0) / watched
      : 0;

    return {
      total,
      watched,
      unwatched,
      avgRating,
      watchedAvgRating,
      movies: items.filter(item => item.type === 'movie').length,
      tvShows: items.filter(item => item.type === 'tv').length
    };
  });

  const getTitle = (item: WatchlistEntry): string => {
    return 'title' in item ? item.title : item.name;
  };

  const getYear = (item: WatchlistEntry): string => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return date ? new Date(date).getFullYear().toString() : 'N/A';
  };

  const toggleWatched = (id: number, type: 'movie' | 'tv') => {
    setWatchlist(prev => 
      prev.map(item => 
        item.id === id && item.type === type 
          ? { ...item, isWatched: !item.isWatched }
          : item
      )
    );
  };

  const removeFromWatchlist = (id: number, type: 'movie' | 'tv') => {
    setWatchlist(prev => prev.filter(item => !(item.id === id && item.type === type)));
  };

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
          </select>
          
          <select 
            value={sortBy()}
            onInput={(e) => setSortBy(e.target.value as any)}
            class="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            <option value="dateAdded">Fecha agregada</option>
            <option value="rating">Rating</option>
            <option value="title">Título</option>
          </select>
        </div>
      </div>

      {/* Stats Panel */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-300">{stats().total}</div>
          <div class="text-xs text-gray-300">Total</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-300">{stats().watched}</div>
          <div class="text-xs text-gray-300">Vistas</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-yellow-300">{stats().avgRating.toFixed(1)}</div>
          <div class="text-xs text-gray-300">★ Promedio</div>
        </div>
        
        <div class="bg-black bg-opacity-30 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-300">{stats().watchedAvgRating.toFixed(1)}</div>
          <div class="text-xs text-gray-300">★ Vistas</div>
        </div>
      </div>

      {/* Content */}
      <Show 
        when={filteredItems().length > 0} 
        fallback={
          <div class="text-center py-12">
            <div class="text-gray-400 text-lg mb-4">
              {stats().total === 0 
                ? "📭 Tu watchlist está vacía" 
                : `🔍 No hay elementos para "${filter()}"`}
            </div>
            <div class="text-gray-500 text-sm">
              {stats().total === 0 
                ? "Agrega películas y series usando los botones ➕ en otros componentes"
                : "Prueba cambiando el filtro arriba"}
            </div>
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={filteredItems()}>
            {(item) => (
              <div class={`bg-black bg-opacity-40 rounded-lg p-4 border-l-4 ${
                item.isWatched ? 'border-green-500' : 'border-yellow-500'
              } transition-all hover:bg-opacity-60`}>
                <div class="flex gap-3">
                  <div class="flex-shrink-0">
                    <Show 
                      when={item.poster_path}
                      fallback={
                        <div class="w-16 h-24 bg-gray-600 rounded flex items-center justify-center">
                          <span class="text-gray-400 text-xs">No img</span>
                        </div>
                      }
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={getTitle(item)}
                        class="w-16 h-24 object-cover rounded"
                      />
                    </Show>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <h3 class="text-white font-semibold text-sm mb-1 truncate">
                      {getTitle(item)}
                    </h3>
                    
                    <div class="flex items-center gap-2 mb-2 text-xs">
                      <span class="text-gray-400">📅 {getYear(item)}</span>
                      <span class="text-yellow-400">★ {item.vote_average.toFixed(1)}</span>
                      <span class="text-gray-400">
                        {item.type === 'movie' ? '🎬' : '📺'}
                      </span>
                    </div>
                    
                    <div class="text-xs text-gray-400 mb-3">
                      Agregado: {new Date(item.dateAdded).toLocaleDateString()}
                    </div>
                    
                    <div class="flex gap-1">
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
                        class="px-2 py-1 rounded text-xs bg-red-600 hover:bg-red-700 text-white transition-colors"
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
          </div>
          <div class="text-blue-300 font-medium">
            Solid.js Component • Estado global compartido
          </div>
        </div>
      </div>
    </div>
  );
}