import type { APIRoute } from 'astro';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const KEY = process.env.TMDB_API_KEY;
export const get: APIRoute = async ({ url }) => {
if (!KEY) {
return new Response(JSON.stringify({ error: 'TMDB_API_KEY not set' }), {
status: 500 });
}
const path = url.searchParams.get('path');
const query = url.searchParams.get('query') || '';
if (!path) return new Response('missing path', { status: 400 });
const full = `${TMDB_BASE}/${path}?api_key=${KEY}&${query}`;
const res = await fetch(full);
const data = await res.text();
return new Response(data, { status: res.status, headers: { 'content-type':
res.headers.get('content-type') || 'application/json' } });
};