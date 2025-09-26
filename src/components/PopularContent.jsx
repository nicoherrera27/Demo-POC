import { useState, useEffect } from 'react';
import { IMAGE_BASE_URL } from '../lib/tmdb';

export default function PopularContent({ popularMovies, popularTVShows }) {
  const [activeTab, setActiveTab] = useState('movie');
  const [watchlistItems, setWatchlistItems] = useState(new Set());
  const [loadingItems, setLoadingItems] = useState(new Set());
  const [watchlistStore, setWatchlistStore] = useState(null);

  const currentItems = activeTab === 'movie' ? popularMovies : popularTVShows;

  useEffect(() => {
    const loadWatchlistStore = async () => {
      try {
        const { watchlistStore: store } = await import('../lib/watchlistStore');
        setWatchlistStore(store);
        
        const updateWatchlistState = () => {
          try {
            const currentWatchlist = store.getWatchlist();
            const newSet = new Set();
            currentWatchlist.forEach((item) => {
              newSet.add(`${item.id}-${item.type}`);
            });
            setWatchlistItems(newSet);
          } catch (error) {
            console.error('Error updating watchlist state:', error);
          }
        };

        updateWatchlistState();
        
        const unsubscribe = store.subscribe(() => {
          updateWatchlistState();
        });

        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (error) {
        console.error('Error loading watchlist store:', error);
      }
    };

    loadWatchlistStore();
  }, []);

  const getTitle = (item) => {
    return 'title' in item ? item.title : item.name;
  };

  const getReleaseDate = (item) => {
    return 'release_date' in item ? item.release_date : item.first_air_date;
  };

  const getItemKey = (id, type) => {
    return `${id}-${type}`;
  };

  const isInWatchlist = (id, type) => {
    return watchlistItems.has(getItemKey(id, type));
  };

  const handleWatchlistAction = async (item, type) => {
    if (!watchlistStore) return;
    
    const itemKey = getItemKey(item.id, type);
    
    try {
      setLoadingItems(prev => new Set(prev).add(itemKey));
      
      const isAlreadyInWatchlist = watchlistStore.isInWatchlist(item.id, type);
      
      if (isAlreadyInWatchlist) {
        watchlistStore.removeFromWatchlist(item.id, type);
      } else {
        watchlistStore.addToWatchlist(item, type);
      }
    } catch (error) {
      console.error('Error al actualizar la watchlist:', error);
    } finally {
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary-400">
          🔥 Populares 
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => switchTab('movie')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'movie'
                ? 'bg-primary-600 text-white shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Peliculas ({popularMovies.length})
          </button>
          
          <button
            onClick={() => switchTab('tv')}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'tv'
                ? 'bg-primary-600 text-white shadow-lg scale-105'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Series ({popularTVShows.length})
          </button>
        </div>
      </div>

      <div className="mb-4 text-center">
        <div className="text-sm text-gray-400">
          Mostrando {currentItems.length} {activeTab === 'movie' ? 'peliculas' : 'series'} populares
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((item) => {
          const title = getTitle(item);
          const releaseDate = getReleaseDate(item);
          const itemKey = getItemKey(item.id, activeTab);
          const isLoading = loadingItems.has(itemKey);
          const inWatchlist = isInWatchlist(item.id, activeTab);

          return (
            <div
              key={itemKey}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-700"
            >
              <div className="relative">
                <img
                  src={`${IMAGE_BASE_URL}${item.poster_path}`}
                  alt={title}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-sm font-bold">
                  {item.vote_average.toFixed(1)}
                </div>
                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                  {activeTab === 'movie' ? 'Pelicula' : 'Serie'}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-white">
                  {title}
                </h3>
                <p className="text-gray-400 text-sm mb-2">
                  {new Date(releaseDate).getFullYear()}
                </p>
                <p className="text-gray-300 text-sm line-clamp-3 mb-4">
                  {item.overview}
                </p>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                    {activeTab === 'movie' ? 'Película' : 'Serie'}
                  </span>
                </div>

                <button
                  onClick={() => handleWatchlistAction(item, activeTab)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium ${
                    inWatchlist 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                >
                  {isLoading ? (
                    <>Cargando...</>
                  ) : inWatchlist ? (
                    <>Eliminar de Mi Lista</>
                  ) : (
                    <>➕ Agregar a Mi Lista</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {currentItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">
            No hay {activeTab === 'movie' ? 'Peliculas' : 'Series'} disponibles
          </div>
          <div className="text-gray-500 text-sm">
            Verifica la configuración de la API
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <div className="text-gray-300">
            Contenido popular de TMDB | {activeTab === 'movie' ? 'Peliculas' : 'Series de TV'}
          </div>
        </div>
      </div>
    </div>
  );
}