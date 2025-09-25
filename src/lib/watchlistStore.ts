
import type { Movie, TVShow } from '../types/movies';

export interface WatchlistItem {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  year: number;
  vote_average: number;
  vote_count: number;
  type: 'movie' | 'tv';
  dateAdded: string;
  isWatched: boolean;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
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

  private normalizePriority(value: unknown): WatchlistItem['priority'] {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
        return normalized as WatchlistItem['priority'];
      }
    }
    return 'medium';
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
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as Record<string, unknown>;
    const idRaw = source.id ?? source.tmdbId ?? source.tmdbID;
    const idNumber = typeof idRaw === 'number' ? idRaw : Number(idRaw);
    if (!Number.isFinite(idNumber)) {
      return null;
    }
    const id = Math.trunc(idNumber);

    const type = this.normalizeType(source.type);
    const title = this.pickString(source.title, source.name) ?? 'Untitled item';
    const overview = this.pickString(source.overview, source.description, source.plot, source.synopsis);
    const poster_path = this.pickString(source.poster_path, source.poster, source.posterUrl, source.posterPath);
    const backdrop_path = this.pickString(source.backdrop_path, source.backdrop, source.backdropUrl, source.backdropPath);

    const releaseDate = this.pickString(source.release_date, source.first_air_date, source.date, source.premiereDate);
    const yearCandidate = this.normalizeNumber(source.year);
    const year = Number.isFinite(yearCandidate) && yearCandidate > 0
      ? Math.trunc(yearCandidate)
      : releaseDate
        ? new Date(releaseDate).getFullYear()
        : new Date().getFullYear();

    const vote_average = this.normalizeNumber(source.vote_average ?? source.rating);
    const vote_count = Math.max(0, Math.trunc(this.normalizeNumber(source.vote_count ?? source.votes)));

    const dateAdded = this.ensureIsoDate(this.pickString(source.dateAdded, source.addedAt, source.createdAt));
    const watchedFlag = this.parseBoolean(source.isWatched ?? source.watched);
    const dateWatched = watchedFlag
      ? this.ensureIsoDate(this.pickString(source.dateWatched, source.watchedAt), dateAdded)
      : undefined;

    const priority = this.normalizePriority(source.priority);
    const notes = this.pickString(source.notes, source.comment, source.comments);

    return {
      id,
      title,
      overview: overview ?? undefined,
      poster_path: poster_path ?? undefined,
      backdrop_path: backdrop_path ?? undefined,
      year,
      vote_average,
      vote_count,
      type,
      dateAdded,
      isWatched: watchedFlag,
      notes: notes ?? undefined,
      priority,
      dateWatched,
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
      overview: this.pickString(item.overview) ?? undefined,
      poster_path: this.pickString(movieLike.poster_path, tvLike.poster_path) ?? undefined,
      backdrop_path: this.pickString(movieLike.backdrop_path, tvLike.backdrop_path) ?? undefined,
      year: releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear(),
      vote_average: this.normalizeNumber(movieLike.vote_average ?? tvLike.vote_average ?? 0),
      vote_count: Math.max(0, Math.trunc(this.normalizeNumber(movieLike.vote_count ?? tvLike.vote_count ?? 0))),
      type: normalizedType,
      dateAdded: new Date().toISOString(),
      isWatched: false,
      priority: 'medium',
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

  setPriority(id: number, type: 'movie' | 'tv', priority: 'high' | 'medium' | 'low'): boolean {
    const normalizedType = this.normalizeType(type);
    const item = this.watchlist.find(entry => entry.id === id && entry.type === normalizedType);
    if (!item) {
      return false;
    }

    item.priority = this.normalizePriority(priority);
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  updateNotes(id: number, type: 'movie' | 'tv', notes: string): boolean {
    const normalizedType = this.normalizeType(type);
    const item = this.watchlist.find(entry => entry.id === id && entry.type === normalizedType);
    if (!item) {
      return false;
    }

    const cleaned = notes?.trim();
    item.notes = cleaned ? cleaned : undefined;
    this.saveToStorage();
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

 

  forceUpdate(): void {
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

export const WatchlistEvents = {
  ADD_TO_WATCHLIST: 'watchlist:add',
  REMOVE_FROM_WATCHLIST: 'watchlist:remove',
  TOGGLE_WATCHED: 'watchlist:toggle',
  UPDATE_WATCHLIST: 'watchlist:update',

  setupGlobalListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const globalWindow = window as unknown as Record<string, unknown>;
    if (globalWindow.__watchlistEventsSetup) {
      return;
    }
    globalWindow.__watchlistEventsSetup = true;

    window.addEventListener('addToWatchlist', ((event: CustomEvent) => {
      const { item, type } = event.detail || {};
      if (!item) {
        return;
      }
      watchlistStore.addToWatchlist(item, type);
    }) as EventListener);

    window.addEventListener(this.ADD_TO_WATCHLIST, ((event: CustomEvent) => {
      const { item, type } = event.detail || {};
      if (!item) {
        return;
      }
      watchlistStore.addToWatchlist(item, type);
    }) as EventListener);

    window.addEventListener(this.REMOVE_FROM_WATCHLIST, ((event: CustomEvent) => {
      const { id, type } = event.detail || {};
      if (typeof id !== 'number') {
        return;
      }
      watchlistStore.removeFromWatchlist(id, type);
    }) as EventListener);

    window.addEventListener(this.TOGGLE_WATCHED, ((event: CustomEvent) => {
      const { id, type } = event.detail || {};
      if (typeof id !== 'number') {
        return;
      }
      watchlistStore.toggleWatched(id, type);
    }) as EventListener);

  }
};

if (typeof window !== 'undefined') {

  WatchlistEvents.setupGlobalListeners();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      WatchlistEvents.setupGlobalListeners();
    });
  }

  (window as unknown as Record<string, unknown>).watchlistStore = watchlistStore;
  (window as unknown as Record<string, unknown>).WatchlistEvents = WatchlistEvents;

}
