import { createSignal, onCleanup, onMount } from "solid-js";

export default function MovieStats(props: { movies?: any[] }) {
  const [seenCount, setSeenCount] = createSignal(0);
  const [watchlistCount, setWatchlistCount] = createSignal(0);
  const [avgRating, setAvgRating] = createSignal(0);

  const recalc = () => {
    const movies = props.movies || [];
    let seen = 0;

    movies.forEach((m: any) => {
      if (localStorage.getItem("seen_" + m.id) === "1") seen++;
    });
    setSeenCount(seen);

    const wl = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setWatchlistCount(wl.length);

    const ids = new Set(wl.map((x: any) => x.id));
    const ratings = movies
      .filter((m: any) => ids.has(m.id))
      .map((m: any) => m.vote_average || 0);

    setAvgRating(
      ratings.length
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
          ) / 10
        : 0
    );
  };

  onMount(() => {
    // calcular cuando el componente carga
    recalc();

    // listeners para eventos del navegador
    const onToggle = () => recalc();
    const onWatch = () => recalc();

    window.addEventListener("movie:toggleSeen", onToggle);
    window.addEventListener("watchlist:updated", onWatch);

    // cleanup
    onCleanup(() => {
      window.removeEventListener("movie:toggleSeen", onToggle);
      window.removeEventListener("watchlist:updated", onWatch);
    });
  });

  return (
    <div>
      <h3 class="font-semibold mb-2">Estadísticas</h3>
      <div class="grid grid-cols-1 gap-2">
        <div>Vistas marcadas: {seenCount()}</div>
        <div>En watchlist: {watchlistCount()}</div>
        <div>Rating promedio (watchlist): {avgRating()}</div>
      </div>
    </div>
  );
}
