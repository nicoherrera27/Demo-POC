import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

interface WatchlistItem {
  id: number;
  title: string;
  poster?: string;
}

export default function Watchlist() {
  const [list, setList] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const loadWatchlist = () => {
      const storedList = JSON.parse(localStorage.getItem('watchlist') || '[]');
      setList(storedList);
    };

    loadWatchlist();
    window.addEventListener('watchlist:updated', loadWatchlist);
    
    return () => window.removeEventListener('watchlist:updated', loadWatchlist);
  }, []);

  const handleRemove = (id: number) => {
    const updatedList = list.filter((item) => item.id !== id);
    localStorage.setItem('watchlist', JSON.stringify(updatedList));
    setList(updatedList);
  };

  const EmptyState = () => (
    <p className="text-sm text-gray-600">No hay películas guardadas</p>
  );

  const WatchlistItem = ({ item }: { item: WatchlistItem }) => (
    <li className="flex items-center gap-2" key={item.id}>
      {item.poster ? (
        <img 
          src={item.poster} 
          alt={item.title}
          className="w-12 h-16 object-cover rounded" 
        />
      ) : (
        <div className="w-12 h-16 bg-gray-200 rounded" />
      )}
      <div className="flex-1">
        <div className="font-medium">{item.title}</div>
      </div>
      <button 
        onClick={() => handleRemove(item.id)} 
        className="px-2 py-1 bg-red-500 text-white rounded"
      >
        Eliminar
      </button>
    </li>
  );

  return (
    <div>
      <h3 className="font-semibold mb-2">Watchlist</h3>
      {list.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {list.map((item) => (
            <WatchlistItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
