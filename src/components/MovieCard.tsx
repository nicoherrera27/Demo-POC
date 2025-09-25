import { useState, useEffect } from 'preact/hooks';
import type { Movie, TVShow } from '../types/movies.ts';
import { IMAGE_BASE_URL } from '../lib/tmdb';

interface Props {
  item: Movie | TVShow;
  type: 'movie' | 'tv';
}
const { watchlistStore } = await import('../lib/watchlistStore')

export default function MovieCard({ item, type }: Props) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const releaseDate = type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      try {
        const inWatchlist = watchlistStore.isInWatchlist(item.id, type);
        setIsInWatchlist(inWatchlist);
      } catch (error) {
        alert('Error checking initial status:'+ error);
      }
    };

    checkWatchlistStatus();
    
    const timeoutId = setTimeout(checkWatchlistStatus, 100);
    
    return () => clearTimeout(timeoutId);
  }, [item.id, type, title]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        
        unsubscribe = watchlistStore.subscribe(() => {
          const inWatchlist = watchlistStore.isInWatchlist(item.id, type);
          setIsInWatchlist(inWatchlist);
        });
      } catch (error) {
        alert('Error setting up listener:' + error);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [item.id, type]);

  const handleWatchlistAction = async () => {
    try {
      setIsLoading(true);
      
      if (isInWatchlist) {
        watchlistStore.removeFromWatchlist(item.id, type);
      } else {
        watchlistStore.addToWatchlist(item, type);
      }  
    } catch (error) {
      alert('Error al actualizar la watchlist: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
      <div class="relative">
        <img
          src={`${IMAGE_BASE_URL}${item.poster_path}`}
          alt={title}
          class="w-full h-64 object-cover"
        />
        <div class="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm font-bold">
         {item.vote_average.toFixed(1)}
        </div>
      </div>
      
      <div class="p-4">
        <h3 class="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
        <p class="text-gray-400 text-sm mb-2">
         {new Date(releaseDate).getFullYear()}
        </p>
        <p class="text-gray-300 text-sm line-clamp-3 mb-4">{item.overview}</p>
        
        <div class="flex justify-between items-center mb-4">
          <span class="text-xs bg-gray-700 px-2 py-1 rounded">
            {type === 'movie' ? 'Película' : 'Serie'}
          </span>
          <span class="text-xs text-gray-500">
            React Component
          </span>
        </div>

        <button
          onClick={handleWatchlistAction}
          disabled={isLoading}
          class={`w-full px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium ${
            isInWatchlist 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>Cargando...</>
          ) : isInWatchlist ? (
            <>Eliminar de Watchlist</>
          ) : (
            <>➕ Agregar a Watchlist</>
          )}
        </button>
      </div>
    </div>
  );
}