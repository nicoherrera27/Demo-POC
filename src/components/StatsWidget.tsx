import { useState, useEffect } from 'preact/hooks';
import { tmdbApi } from '../lib/tmdb.js';
interface Stats {
  totalMovies: number;
  totalTVShows: number;
  avgMovieRating: number;
  avgTVRating: number;
  topGenres: string[];
}

export default function StatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'movies' | 'tv' | 'ratings' | 'genres'>('movies');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [popularMovies, topRatedMovies, popularTV, topRatedTV] = await Promise.all([
          tmdbApi.getPopularMovies(),
          tmdbApi.getTopRatedMovies(),
          tmdbApi.getPopularTVShows(),
          tmdbApi.getTopRatedTVShows()
        ]);

        const allMovies = [...popularMovies.results, ...topRatedMovies.results];
        const allTV = [...popularTV.results, ...topRatedTV.results];

        const avgMovieRating = allMovies.reduce((sum, movie) => sum + movie.vote_average, 0) / allMovies.length;
        const avgTVRating = allTV.reduce((sum, show) => sum + show.vote_average, 0) / allTV.length;

        setStats({
          totalMovies: popularMovies.total_results,
          totalTVShows: popularTV.total_results,
          avgMovieRating,
          avgTVRating,
          topGenres: ['Accion', 'Drama', 'Comedia', 'Sci-Fi', 'Romance']
        });
      } catch (error) {
        alert('Error fetching stats:' + error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div class="text-center py-8">
          <div class="text-primary-400">Cargando estadisticas...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div class="text-center py-8 text-red-400">
          Error cargando estadisticas
        </div>
      </div>
    );
  }

  const metrics = [
    {
      id: 'movies' as const,
      label: 'Peliculas',
      value: stats.totalMovies.toLocaleString(),
      subtitle: 'Total disponibles',
      color: 'text-blue-400'
    },
    {
      id: 'tv' as const,
      label: 'Series',
      value: stats.totalTVShows.toLocaleString(),
      subtitle: 'Total disponibles',
      color: 'text-green-400'
    },
    {
      id: 'ratings' as const,
      label: 'Rating Promedio',
      value: `${stats.avgMovieRating.toFixed(1)} / ${stats.avgTVRating.toFixed(1)}`,
      subtitle: 'Peliculas / Series',
      color: 'text-yellow-400'
    },
    {
      id: 'genres' as const,
      label: 'Generos Top',
      value: stats.topGenres.length.toString(),
      subtitle: 'Categorías principales',
      color: 'text-purple-400'
    }
  ];

  return (
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-6 text-primary-400">
        Estadisticas
      </h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <button key={metric.id} onClick={() => setActiveMetric(metric.id)} class={`p-4 rounded-lg transition-all border-2 text-left ${activeMetric === metric.id ? 'border-primary-500 bg-primary-900 bg-opacity-50' : 'border-gray-600 bg-gray-700 hover:bg-gray-600'}`}>
            <div class={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <div class="text-gray-300 text-sm mt-1">
              {metric.label}
            </div>
            <div class="text-gray-400 text-xs mt-1">
              {metric.subtitle}
            </div>
          </button>
        ))}
      </div>

      <div class="bg-gray-700 p-4 rounded-lg">
        {activeMetric === 'movies' && (
          <div>
            <h3 class="text-lg font-semibold text-blue-400 mb-3">Detalles de Peliculas</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-300">Total en base de datos:</span>
                <span class="text-white font-medium">{stats.totalMovies.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Rating promedio:</span>
                <span class="text-white font-medium">{stats.avgMovieRating.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Categoria mas popular:</span>
                <span class="text-white font-medium">Accion</span>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'tv' && (
          <div>
            <h3 class="text-lg font-semibold text-green-400 mb-3">Detalles de Series</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-300">Total en base de datos:</span>
                <span class="text-white font-medium">{stats.totalTVShows.toLocaleString()}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Rating promedio:</span>
                <span class="text-white font-medium">{stats.avgTVRating.toFixed(2)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Categoria mas popular:</span>
                <span class="text-white font-medium">Drama</span>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'ratings' && (
          <div>
            <h3 class="text-lg font-semibold text-yellow-400 mb-3">Analisis de Ratings</h3>
            <div class="space-y-3">
              <div class="flex items-center gap-4">
                <span class="text-gray-300 w-20">Peliculas:</span>
                <div class="flex-1 bg-gray-600 rounded-full h-3">
                  <div 
                    class="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.avgMovieRating / 10) * 100}%` }}
                  ></div>
                </div>
                <span class="text-white font-medium w-12">{stats.avgMovieRating.toFixed(1)}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-gray-300 w-20">Series:</span>
                <div class="flex-1 bg-gray-600 rounded-full h-3">
                  <div 
                    class="bg-green-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.avgTVRating / 10) * 100}%` }}
                  ></div>
                </div>
                <span class="text-white font-medium w-12">{stats.avgTVRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'genres' && (
          <div>
            <h3 class="text-lg font-semibold text-purple-400 mb-3">Generos Populares</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
              {stats.topGenres.map((genre, index) => (
                <div 
                  key={genre}
                >
                  <span class="font-medium">#{index + 1}</span> {genre}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}