import { createSignal, onMount, For, Show } from 'solid-js';

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
}

interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
}

const API_KEY = '4c13d79da36a97c80e70be9f823eb0ac';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export default function TopRatedSolid() {
  const [activeTab, setActiveTab] = createSignal<'movies' | 'tv'>('movies');
  const [movies, setMovies] = createSignal<Movie[]>([]);
  const [tvShows, setTVShows] = createSignal<TVShow[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal('');
  const [currentIndex, setCurrentIndex] = createSignal(0);

  const fetchData = async () => {
    if (!API_KEY || API_KEY === '4c13d79da36a97c80e70be9f823eb0ac') {
      setError('API Key no configurada');
      setLoading(false);
      return;
    }

    try {
      const [moviesRes, tvRes] = await Promise.all([
        fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=es-ES`),
        fetch(`${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=es-ES`)
      ]);

      if (!moviesRes.ok || !tvRes.ok) {
        throw new Error('Error al cargar datos');
      }

      const moviesData = await moviesRes.json();
      const tvData = await tvRes.json();

      setMovies(moviesData.results.slice(0, 8));
      setTVShows(tvData.results.slice(0, 8));
      setError('');
    } catch (err) {
      console.error('Error:', err);
      setError('Error cargando contenido');
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetchData();
    
    const interval = setInterval(() => {
      const items = getCurrentItems();
      if (items.length > 4) {
        setCurrentIndex(prev => (prev + 1) % (items.length - 3));
      }
    }, 4000);

    return () => clearInterval(interval);
  });

  const getCurrentItems = () => {
    return activeTab() === 'movies' ? movies() : tvShows();
  };

  const getTitle = (item: Movie | TVShow) => {
    return 'title' in item ? item.title : item.name;
  };

  const getYear = (item: Movie | TVShow) => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return new Date(date).getFullYear().toString();
  };

  const switchTab = (tab: 'movies' | 'tv') => {
    setActiveTab(tab);
    setCurrentIndex(0);
  };

  const nextSlide = () => {
    const items = getCurrentItems();
    if (items.length > 4) {
      setCurrentIndex(prev => (prev + 1) % (items.length - 3));
    }
  };

  const prevSlide = () => {
    const items = getCurrentItems();
    if (items.length > 4) {
      setCurrentIndex(prev => (prev - 1 + (items.length - 3)) % (items.length - 3));
    }
  };

  return (
    <div class="bg-gradient-to-br from-gray-800 via-gray-900 to-black p-6 rounded-lg shadow-lg">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-blue-400">
          🏆 Mejor Valorados (Solid Component)
        </h2>
        
        <div class="flex gap-2">
          <button
            onClick={() => switchTab('movies')}
            class={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab() === 'movies'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎬 Películas
          </button>
          <button
            onClick={() => switchTab('tv')}
            class={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab() === 'tv'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📺 Series
          </button>
        </div>
      </div>

      <Show when={loading()}>
        <div class="text-center py-12">
          <div class="text-blue-400 text-lg">🔄 Cargando contenido...</div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="text-center py-12">
          <div class="text-red-400 text-lg">❌ {error()}</div>
        </div>
      </Show>

      <Show when={!loading() && !error() && getCurrentItems().length > 0}>
        <div class="relative">
          {/* Navigation Buttons */}
          <Show when={getCurrentItems().length > 4}>
            <button
              onClick={prevSlide}
              class="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
            >
              ◀
            </button>
            
            <button
              onClick={nextSlide}
              class="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
            >
              ▶
            </button>
          </Show>

          {/* Content Grid */}
          <div class="overflow-hidden rounded-lg">
            <div 
              class="flex transition-transform duration-500 ease-in-out"
              style={`transform: translateX(-${currentIndex() * 25}%)`}
            >
              <For each={getCurrentItems()}>
                {(item, index) => (
                  <div class="flex-shrink-0 w-1/4 p-2">
                    <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                      <div class="relative">
                        <Show when={item.poster_path} fallback={
                          <div class="w-full h-56 bg-gray-600 flex items-center justify-center">
                            <span class="text-gray-400 text-sm">Sin imagen</span>
                          </div>
                        }>
                          <img
                            src={`${IMAGE_BASE_URL}${item.poster_path}`}
                            alt={getTitle(item)}
                            class="w-full h-56 object-cover"
                          />
                        </Show>
                        
                        <div class="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          #{index() + 1}
                        </div>
                        
                        <div class="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                          ⭐ {item.vote_average.toFixed(1)}
                        </div>
                      </div>
                      
                      <div class="p-3">
                        <h3 class="text-white font-semibold text-sm mb-1 truncate">
                          {getTitle(item)}
                        </h3>
                        <p class="text-gray-400 text-xs mb-2">
                          📅 {getYear(item)}
                        </p>
                        
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-yellow-400">
                            ⭐ {item.vote_average.toFixed(1)}
                          </span>
                          <span class="text-gray-500">
                            👥 {item.vote_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Progress indicators */}
          <Show when={getCurrentItems().length > 4}>
            <div class="flex justify-center mt-4 gap-2">
              <For each={Array(getCurrentItems().length - 3).fill(0)}>
                {(_, i) => (
                  <button
                    onClick={() => setCurrentIndex(i())}
                    class={`w-3 h-3 rounded-full transition-all ${
                      currentIndex() === i()
                        ? 'bg-blue-500 scale-125'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>

      <Show when={!loading() && !error() && getCurrentItems().length === 0}>
        <div class="text-center py-12">
          <div class="text-gray-400">📭 No hay contenido disponible</div>
        </div>
      </Show>

      {/* Footer */}
      <div class="mt-6 pt-4 border-t border-gray-700">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-300">
            Mostrando {getCurrentItems().length} elementos
          </div>
          <div class="text-blue-400">
            Solid.js Component • {activeTab() === 'movies' ? 'Películas' : 'Series'}
          </div>
        </div>
      </div>
    </div>
  );
}