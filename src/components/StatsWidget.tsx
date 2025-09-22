import { useState, useEffect } from 'preact/hooks';
import { tmdbApi } from '../lib/tmdb.js';
import type { Movie, TVShow } from '../types/movies.ts';

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
          topGenres: ['Acción', 'Drama', 'Comedia', 'Sci-Fi', 'Romance']
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-center py-8">
          <div className="text-primary-400">🔄 Cargando estadísticas...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-center py-8 text-red-400">
          ❌ Error cargando estadísticas
        </div>
      </div>
    );
  }

  const metrics = [
    {
      id: 'movies' as const,
      label: '🎬 Películas',
      value: stats.totalMovies.toLocaleString(),
      subtitle: 'Total disponibles',
      color: 'text-blue-400'
    },
    {
      id: 'tv' as const,
      label: '📺 Series',
      value: stats.totalTVShows.toLocaleString(),
      subtitle: 'Total disponibles',
      color: 'text-green-400'
    },
    {
      id: 'ratings' as const,
      label: '⭐ Rating Promedio',
      value: `${stats.avgMovieRating.toFixed(1)} / ${stats.avgTVRating.toFixed(1)}`,
      subtitle: 'Películas / Series',
      color: 'text-yellow-400'
    },
    {
      id: 'genres' as const,
      label: '🎭 Géneros Top',
      value: stats.topGenres.length.toString(),
      subtitle: 'Categorías principales',
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-primary-400">
        📊 Estadísticas (Preact Component)
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setActiveMetric(metric.id)}
            className={`p-4 rounded-lg transition-all border-2 text-left ${
              activeMetric === metric.id
                ? 'border-primary-500 bg-primary-900 bg-opacity-50'
                : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className={`text-2xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
            <div className="text-gray-300 text-sm mt-1">
              {metric.label}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              {metric.subtitle}
            </div>
          </button>
        ))}
      </div>

      {/* Detailed view based on active metric */}
      <div className="bg-gray-700 p-4 rounded-lg">
        {activeMetric === 'movies' && (
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-3">🎬 Detalles de Películas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Total en base de datos:</span>
                <span className="text-white font-medium">{stats.totalMovies.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Rating promedio:</span>
                <span className="text-white font-medium">⭐ {stats.avgMovieRating.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Categoría más popular:</span>
                <span className="text-white font-medium">🎭 Acción</span>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'tv' && (
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-3">📺 Detalles de Series</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Total en base de datos:</span>
                <span className="text-white font-medium">{stats.totalTVShows.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Rating promedio:</span>
                <span className="text-white font-medium">⭐ {stats.avgTVRating.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Categoría más popular:</span>
                <span className="text-white font-medium">🎭 Drama</span>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'ratings' && (
          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">⭐ Análisis de Ratings</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-gray-300 w-20">Películas:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.avgMovieRating / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium w-12">{stats.avgMovieRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-300 w-20">Series:</span>
                <div className="flex-1 bg-gray-600 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(stats.avgTVRating / 10) * 100}%` }}
                  ></div>
                </div>
                <span className="text-white font-medium w-12">{stats.avgTVRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {activeMetric === 'genres' && (
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-3">🎭 Géneros Populares</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {stats.topGenres.map((genre, index) => (
                <div 
                  key={genre}
                  className="bg-gray-600 px-3 py-2 rounded-lg text-sm text-center hover:bg-gray-500 transition-colors"
                >
                  <span className="font-medium">#{index + 1}</span> {genre}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-600">
          <div className="text-xs text-gray-500 text-right">
            Preact Component • Datos actualizados en tiempo real
          </div>
        </div>
      </div>
    </div>
  );
}