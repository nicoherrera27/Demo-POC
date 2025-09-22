import { useState, useEffect } from 'preact/hooks';
import type { Movie, TVShow } from '../types/movies.ts';
import { IMAGE_BASE_URL } from '../lib/tmdb';

interface Props {
  item: Movie | TVShow;
  type: 'movie' | 'tv';
}

export default function MovieCard({ item, type }: Props) {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const releaseDate = type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;

  // Verificar estado inicial - ejecutar inmediatamente
  useEffect(() => {
    const checkWatchlistStatus = async () => {
      try {
        const { watchlistStore } = await import('../lib/watchlistStore');
        const inWatchlist = watchlistStore.isInWatchlist(item.id, type);
        setIsInWatchlist(inWatchlist);
        console.log('🔍 MovieCard: Initial status for', title, ':', inWatchlist);
      } catch (error) {
        console.error('Error checking initial status:', error);
      }
    };

    // Verificar inmediatamente
    checkWatchlistStatus();
    
    // También verificar después de un pequeño delay para asegurar que el store esté listo
    const timeoutId = setTimeout(checkWatchlistStatus, 100);
    
    return () => clearTimeout(timeoutId);
  }, [item.id, type, title]);

  // Escuchar cambios en el store
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        const { watchlistStore } = await import('../lib/watchlistStore');
        
        unsubscribe = watchlistStore.subscribe(() => {
          const inWatchlist = watchlistStore.isInWatchlist(item.id, type);
          setIsInWatchlist(inWatchlist);
          console.log('🔄 MovieCard: Status updated for', title, ':', inWatchlist);
        });
      } catch (error) {
        console.error('Error setting up listener:', error);
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
      const { watchlistStore } = await import('../lib/watchlistStore');
      
      if (isInWatchlist) {
        // Remover de watchlist
        console.log('🗑️ MovieCard: Removing from watchlist:', title, type);
        const success = watchlistStore.removeFromWatchlist(item.id, type);
        if (success) {
          console.log('✅ MovieCard: Successfully removed:', title);
        }
      } else {
        // Agregar a watchlist
        console.log('🎬 MovieCard: Adding to watchlist:', title, type);
        const success = watchlistStore.addToWatchlist(item, type);
        if (success) {
          console.log('✅ MovieCard: Successfully added:', title);
        } else {
          console.log('⚠️ MovieCard: Item already in watchlist:', title);
        }
      }
      
    } catch (error) {
      console.error('❌ MovieCard: Error with watchlist action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
      <div className="relative">
        <img
          src={`${IMAGE_BASE_URL}${item.poster_path}`}
          alt={title}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm font-bold">
          ⭐ {item.vote_average.toFixed(1)}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-2">
          📅 {new Date(releaseDate).getFullYear()}
        </p>
        <p className="text-gray-300 text-sm line-clamp-3 mb-4">{item.overview}</p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
            {type === 'movie' ? '🎬 Película' : '📺 Serie'}
          </span>
          <span className="text-xs text-gray-500">
            React Component
          </span>
        </div>

        {/* Botón para agregar/remover watchlist */}
        <button
          onClick={handleWatchlistAction}
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium ${
            isInWatchlist 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>🔄 Cargando...</>
          ) : isInWatchlist ? (
            <>🗑️ Eliminar de Watchlist</>
          ) : (
            <>➕ Agregar a Watchlist</>
          )}
        </button>
      </div>
    </div>
  );
}