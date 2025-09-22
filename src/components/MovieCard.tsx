import type { Movie, TVShow } from '../types/movies.ts';
import { IMAGE_BASE_URL } from '../lib/tmdb.ts';

interface Props {
  item: Movie | TVShow;
  type: 'movie' | 'tv';
}

export default function MovieCard({ item, type }: Props) {
  const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
  const releaseDate = type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;

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
        <p className="text-gray-300 text-sm line-clamp-3">{item.overview}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs bg-gray-700 px-2 py-1 rounded">
            {type === 'movie' ? '🎬 Película' : '📺 Serie'}
          </span>
          <span className="text-xs text-gray-500">
            React Component
          </span>
        </div>
      </div>
    </div>
  );
}