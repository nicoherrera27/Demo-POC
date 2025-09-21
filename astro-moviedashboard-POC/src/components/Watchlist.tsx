import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';
export default function Watchlist() {
const [list, setList] = useState<any[]>([]);
useEffect(() => {
const load = () => {
const l = JSON.parse(localStorage.getItem('watchlist') || '[]');
setList(l);
};
load();
window.addEventListener('watchlist:updated', load);
return () => window.removeEventListener('watchlist:updated', load);
}, []);
function remove(id: number) {
const l = list.filter((x) => x.id !== id);
localStorage.setItem('watchlist', JSON.stringify(l));
setList(l);
}
return (
<div>
<h3 className="font-semibold mb-2">Watchlist</h3>
{list.length === 0 ? (
<p className="text-sm text-gray-600">No hay películas guardadas</p>
) : (
<ul className="space-y-2">
{list.map((item) => (
<li className="flex items-center gap-2" key={item.id}>
{item.poster ? <img src={item.poster} alt={item.title}
className="w-12 h-16 object-cover rounded" /> : <div className="w-12 h-16 bggray-200 rounded" />}
<div className="flex-1">
<div className="font-medium">{item.title}</div>
</div>
<button onClick={() => remove(item.id)} className="px-2 py-1
bg-red-500 text-white rounded">Eliminar</button>
</li>
))}
</ul>
)}
</div>
);
}
