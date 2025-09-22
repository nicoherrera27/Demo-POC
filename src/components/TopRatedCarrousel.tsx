import { createSignal, onMount, For, Show } from 'solid-js';
import { tmdbApi, IMAGE_BASE_URL } from '../lib/tmdb';
import type { Movie, TVShow } from '../types/movies.ts';

interface Props {}

export default function TopRatedCarousel(props: Props) {
  const [activeTab, setActiveTab] = createSignal<'movies' | 'tv'>('movies');
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [topMovies, setTopMovies] = createSignal<Movie[]>([]);
  const [topTVShows, setTopTVShows] = createSignal<TVShow[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string>('');

  // Load data on mount
  onMount(async () => {
    try {
      const [moviesResponse, tvResponse] = await Promise.all([
        tmdbApi.getTopRatedMovies(),
        tmdbApi.getTopRatedTVShows()
      ]);
      
      setTopMovies(moviesResponse.results.slice(0, 8));
      setTopTVShows(tvResponse.results.slice(0, 8));
    } catch (err) {
      console.error('Error loading top rated content:', err);
      setError('Error cargando contenido');
    } finally {
      setLoading(false);
    }

    // Auto-scroll functionality
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    // Cleanup
    return () => clearInterval(interval);
  });

  const getCurrentItems = () => {
    return activeTab() === 'movies' ? topMovies() : topTVShows();
  };

  const getTitle = (item: Movie | TVShow): string => {
    return 'title' in item ? item.title : item.name;
  };

  const getReleaseYear = (item: Movie | TVShow): string => {
    const date = 'release_date' in item ? item.release_date : item.first_air_date;
    return new Date(date).getFullYear().toString();
  };

  const nextSlide = () => {
    const items = getCurrentItems();
    if (items && items.length > 3) {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, items.length - 3));
    }
  };

  const prevSlide = () => {
    const items = getCurrentItems();
    if (items && items.length > 3) {
      setCurrentIndex((prev) => (prev - 1 + Math.max(1, items.length - 3)) % Math.max(1, items.length - 3));
    }
  };

  const switchTab = (tab: 'movies' | 'tv') => {
    setActiveTab(tab);
    setCurrentIndex(0);
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
          <div class="text-blue-400 text-lg">
            🔄 Cargando contenido mejor valorado...
          </div>
        </div>
      </Show>

      <Show when={error()}>
        <div class="text-center py-12">
          <div class="text-red-400 text-lg">
            ❌ {error()}
          </div>
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
              ◀️
            </button>
            
            <button
              onClick={nextSlide}
              class="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-3 rounded-full transition-all"
            >
              ▶️
            </button>
          </Show>

          {/* Carousel */}
          <div class="overflow-hidden rounded-lg">
            <div 
              class="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex() * 25}%)`
              }}
            >
              <For each={getCurrentItems()}>
                {(item, index) => (
                  <div class="flex-shrink-0 w-1/4 p-2">
                    <div class="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                      <div class="relative group">
                        <Show 
                          when={item.poster_path} 
                          fallback={
                            <div class="w-full h-56 bg-gray-600 flex items-center justify-center">
                              <span class="text-gray-400">Sin imagen</span>
                            </div>
                          }
                        >
                          <img
                            src={`${IMAGE_BASE_URL}${item.poster_path}`}
                            alt={getTitle(item)}
                            class="w-full h-56 object-cover"
                          />
                        </Show>
                        
                        {/* Overlay with rating */}
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div class="absolute bottom-2 left-2 right-2">
                            <div class="text-white text-sm">
                              <div class="font-bold mb-1">
                                ⭐ {item.vote_average.toFixed(1)}
                              </div>
                              <div class="text-xs opacity-75">
                                👥 {item.vote_count.toLocaleString()} votos
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Rank badge */}
                        <div class="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          #{index() + 1}
                        </div>
                      </div>
                      
                      <div class="p-3">
                        <h3 class="text-white font-semibold text-sm mb-1 overflow-hidden text-ellipsis whitespace-nowrap">
                          {getTitle(item)}
                        </h3>
                        <p class="text-gray-400 text-xs mb-2">
                          📅 {getReleaseYear(item)}
                        </p>
                        
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-1">
                            <span class="text-yellow-400 text-xs">⭐</span>
                            <span class="text-white text-xs font-medium">
                              {item.vote_average.toFixed(1)}
                            </span>
                          </div>
                          <span class="text-xs text-gray-500">
                            {activeTab() === 'movies' ? '🎬' : '📺'}
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
              <For each={Array.from({ length: Math.max(1, getCurrentItems().length - 3) })}>
                {(_, index) => (
                  <button
                    onClick={() => setCurrentIndex(index())}
                    class={`w-3 h-3 rounded-full transition-all ${
                      currentIndex() === index()
                        ? 'bg-blue-500 scale-125'
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                )}
              </For>
            </div>
          </Show>

          {/* Stats bar */}
          <div class="mt-6 bg-gray-700 rounded-lg p-4">
            <div class="flex justify-between items-center text-sm">
              <div class="text-gray-300">
                📊 Mostrando contenido mejor valorado ({getCurrentItems().length} elementos)
              </div>
              <div class="text-blue-400 font-medium">
                {activeTab() === 'movies' ? '🎬 Películas' : '📺 Series'} • Solid.js Component
              </div>
            </div>
          </div>
        </div>
      </Show>

      <Show when={!loading() && !error() && getCurrentItems().length === 0}>
        <div class="text-center py-12">
          <div class="text-gray-400">
            📭 No hay contenido disponible
          </div>
        </div>
      </Show>
    </div>
  );
}