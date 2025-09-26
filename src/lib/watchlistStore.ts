
import type { Movie, TVShow } from '../types/movies';

export interface WatchlistItem {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  year: number;
  vote_average: number;
  vote_count: number;
  type: 'movie' | 'tv';
  dateAdded: string;
  isWatched: boolean;
  dateWatched?: string;
}

export interface WatchlistStats {
  total: number;
  watched: number;
  unwatched: number;
  movies: number;
  tvShows: number;
  avgRating: number;
  watchedAvgRating: number;
}

type WatchlistListener = (watchlist: WatchlistItem[], stats: WatchlistStats) => void;

export interface WatchlistUpdateEventDetail {
  watchlist: WatchlistItem[];
  stats: WatchlistStats;
}

class WatchlistStore {
  private listeners = new Set<WatchlistListener>();
  private watchlist: WatchlistItem[] = [];

  constructor() {
    this.watchlist = this.loadFromStorage();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.notifyListeners();
      }, 50);

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.notifyListeners();
        });
      }
    }
  }

  private loadFromStorage(): WatchlistItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem('movieDashWatchlist');
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const normalized = parsed.map(item => this.normalizeStoredItem(item)).filter((item): item is WatchlistItem => Boolean(item));

      const deduped = this.dedupeAndSort(normalized);
      const normalizedJson = JSON.stringify(deduped);

      if (normalizedJson !== stored) {
        localStorage.setItem('movieDashWatchlist', normalizedJson);
      }
      return deduped;
    } catch (error) {
      alert('[WatchlistStore] Error loading from storage:' + error);
      return [];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('movieDashWatchlist', JSON.stringify(this.watchlist));
    } catch (error) {
      alert('[WatchlistStore] Error saving to storage:' + error);
    }
  }

  private normalizeType(rawType: unknown): 'movie' | 'tv' {
    if (typeof rawType === 'string') {
      const normalized = rawType.trim().toLowerCase();
      if (normalized === 'tv' || normalized === 'show' || normalized === 'series') {
        return 'tv';
      }
      if (normalized === 'movie' || normalized === 'movies' || normalized === 'film' || normalized === 'films') {
        return 'movie';
      }
    }
    return 'movie';
  }


  private pickString(...candidates: unknown[]): string | undefined {
    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
    return undefined;
  }

  private normalizeNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }
    return Boolean(value);
  }

  private ensureIsoDate(value: unknown, fallback?: string): string {
    const toIso = (candidate?: string): string | null => {
      if (!candidate) {
        return null;
      }
      const trimmed = candidate.trim();
      if (!trimmed) {
        return null;
      }
      const parsed = Date.parse(trimmed);
      if (Number.isNaN(parsed)) {
        return null;
      }
      return new Date(parsed).toISOString();
    };

    const direct = typeof value === 'string' ? toIso(value) : null;
    if (direct) {
      return direct;
    }

    if (fallback) {
      const fallbackIso = toIso(fallback);
      if (fallbackIso) {
        return fallbackIso;
      }
    }

    return new Date().toISOString();
  }

  private normalizeStoredItem(raw: unknown): WatchlistItem | null {
  if (!raw || typeof raw !== 'object') return null;
  
  const item = raw as any;
  
  // Validación básica pero suficiente
  if (typeof item.id !== 'number' || !item.title || !['movie', 'tv'].includes(item.type)) {
    return null;
  }
  
  return {
    id: item.id,
    title: item.title,
    overview: item.overview || undefined,
    poster_path: item.poster_path || undefined,
    year: item.year || new Date().getFullYear(),
    vote_average: item.vote_average || 0,
    vote_count: item.vote_count || 0,
    type: item.type,
    dateAdded: item.dateAdded || new Date().toISOString(),
    isWatched: Boolean(item.isWatched),
    dateWatched: item.dateWatched || undefined
  };
}

  private dedupeAndSort(items: WatchlistItem[]): WatchlistItem[] {
    const map = new Map<string, WatchlistItem>();

    for (const item of items) {
      const key = `${item.id}-${item.type}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
        continue;
      }

      const existingTime = this.getTimestamp(existing.dateAdded);
      const candidateTime = this.getTimestamp(item.dateAdded);

      if (candidateTime > existingTime) {
        map.set(key, { ...existing, ...item });
        continue;
      }

      if (candidateTime === existingTime) {
        const existingScore = (existing.poster_path ? 1 : 0) + (existing.overview ? 1 : 0);
        const candidateScore = (item.poster_path ? 1 : 0) + (item.overview ? 1 : 0);
        if (candidateScore > existingScore) {
          map.set(key, { ...existing, ...item });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => this.getTimestamp(b.dateAdded) - this.getTimestamp(a.dateAdded));
  }

  private getTimestamp(value: string): number {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  getWatchlist(): WatchlistItem[] {
    return [...this.watchlist];
  }

  addToWatchlist(item: Movie | TVShow, type: 'movie' | 'tv'): boolean {
    const normalizedType = this.normalizeType(type);
    const movieLike = item as Movie;
    const tvLike = item as TVShow;
    const title = normalizedType === 'movie'
      ? this.pickString(movieLike.title, tvLike.name) ?? 'Untitled item'
      : this.pickString(tvLike.name, movieLike.title) ?? 'Untitled item';

    const releaseDate = normalizedType === 'movie'
      ? this.pickString(movieLike.release_date)
      : this.pickString(tvLike.first_air_date);

   const watchlistItem: WatchlistItem = {
    id: item.id,
    title,
    overview: item.overview || undefined,
    poster_path: item.poster_path || undefined,
    year: releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear(),
    vote_average: item.vote_average || 0,
    vote_count: item.vote_count || 0,
    type: normalizedType,
    dateAdded: new Date().toISOString(),
    isWatched: false
  };

    const exists = this.watchlist.find(existing => existing.id === watchlistItem.id && existing.type === watchlistItem.type);
    if (exists) {
      return false;
    }

    this.watchlist = [watchlistItem, ...this.watchlist];
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  removeFromWatchlist(id: number, type: 'movie' | 'tv'): boolean {
    const normalizedType = this.normalizeType(type);
    const initialLength = this.watchlist.length;
    this.watchlist = this.watchlist.filter(item => !(item.id === id && item.type === normalizedType));

    if (this.watchlist.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  toggleWatched(id: number, type: 'movie' | 'tv'): boolean {
    const normalizedType = this.normalizeType(type);
    const item = this.watchlist.find(entry => entry.id === id && entry.type === normalizedType);
    if (!item) {
      return false;
    }

    item.isWatched = !item.isWatched;
    item.dateWatched = item.isWatched ? new Date().toISOString() : undefined;

    this.saveToStorage();
    this.notifyListeners();
    return true;
  }


  isInWatchlist(id: number, type: 'movie' | 'tv'): boolean {
    const normalizedType = this.normalizeType(type);
    return this.watchlist.some(item => item.id === id && item.type === normalizedType);
  }

  getStats(): WatchlistStats {
    const total = this.watchlist.length;
    const watched = this.watchlist.filter(item => item.isWatched).length;
    const movies = this.watchlist.filter(item => item.type === 'movie').length;
    const tvShows = this.watchlist.filter(item => item.type === 'tv').length;

    const avgRating = total > 0
      ? this.watchlist.reduce((sum, item) => sum + (item.vote_average || 0), 0) / total
      : 0;

    const watchedAvgRating = watched > 0
      ? this.watchlist.filter(item => item.isWatched).reduce((sum, item) => sum + (item.vote_average || 0), 0) / watched
      : 0;

    return {
      total,
      watched,
      unwatched: total - watched,
      movies,
      tvShows,
      avgRating,
      watchedAvgRating,
    };
  }

  subscribe(callback: WatchlistListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(callback => {
      try {
        setTimeout(() => {
          callback([...this.watchlist], { ...stats });
        }, 0);
      } catch (error) {
        alert('[WatchlistStore] Listener error:' + error);
      }
    });

    if (typeof window !== 'undefined') {
      const event = new CustomEvent<WatchlistUpdateEventDetail>('watchlist:update', {
        detail: { watchlist: [...this.watchlist], stats: { ...stats } },
      });
      window.dispatchEvent(event);
    }
  }

  clear(): void {
    this.watchlist = [];
    this.saveToStorage();
    this.notifyListeners();
  }


}

const WATCHLIST_STORE_GLOBAL_KEY = '__MOVIEDASH_WATCHLIST_STORE__';

const getGlobalObject = (): typeof globalThis => {
  if (typeof window !== 'undefined') {
    return window;
  }
  return globalThis;
};

const getOrCreateGlobalStore = (): WatchlistStore => {
  const globalObject = getGlobalObject() as Record<string, unknown>;
  const existingStore = globalObject[WATCHLIST_STORE_GLOBAL_KEY] as WatchlistStore | undefined;

  if (existingStore) {
    return existingStore;
  }

  const store = new WatchlistStore();
  globalObject[WATCHLIST_STORE_GLOBAL_KEY] = store;
  return store;
};

export const watchlistStore = getOrCreateGlobalStore();

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).watchlistStore = watchlistStore;
}

