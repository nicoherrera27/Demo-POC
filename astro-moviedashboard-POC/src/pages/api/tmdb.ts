import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const path = url.searchParams.get('path') || 'search/movie';
  const query = url.searchParams.get('query') || '';
  const page = url.searchParams.get('page') || '1';

  if (!import.meta.env.TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: 'TMDB_API_KEY not set' }), { status: 500 });
  }

  const tmdbUrl = `https://api.themoviedb.org/3/${path}?${new URLSearchParams({
    api_key: import.meta.env.TMDB_API_KEY,
    query,
    page,
  })}`;

  const res = await fetch(tmdbUrl);
  const data = await res.json();
  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
};
