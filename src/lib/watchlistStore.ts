// src/lib/watchlistStore.ts
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

class WatchlistStore {
  private listeners = new Set<WatchlistListener>();
  private watchlist: WatchlistItem[] = [];

  constructor() {
    // Cargar datos inmediatamente
    this.watchlist = this.loadFromStorage();
    console.log('🏪 WatchlistStore initialized with', this.watchlist.length, 'items');
    
    // Si estamos en el browser, notificar inmediatamente
    if (typeof window !== 'undefined') {
      // Usar setTimeout para asegurar que los componentes estén montados
      setTimeout(() => {
        console.log('🔄 Initial notification to components');
        this.notifyListeners();
      }, 50);
      
      // También notificar cuando el DOM esté completamente cargado
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('🔄 DOM loaded, notifying components');
          this.notifyListeners();
        });
      }
    }
  }

  // Cargar desde localStorage
  private loadFromStorage(): WatchlistItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('movieDashWatchlist');
      const items = stored ? JSON.parse(stored) : [];
      console.log('💾 Loaded from storage:', items.length, 'items');
      return items;
    } catch (error) {
      console.error('❌ Error loading from storage:', error);
      return [];
    }
  }

  // Guardar en localStorage
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('movieDashWatchlist', JSON.stringify(this.watchlist));
      console.log('💾 Saved to storage:', this.watchlist.length, 'items');
    } catch (error) {
      console.error('❌ Error saving to storage:', error);
    }
  }

  // Obtener la watchlist actual
  getWatchlist(): WatchlistItem[] {
    return [...this.watchlist];
  }

  // Agregar elemento a la watchlist
  addToWatchlist(item: Movie | TVShow, type: 'movie' | 'tv'): boolean {
    const title = type === 'movie' ? (item as Movie).title : (item as TVShow).name;
    const releaseDate = type === 'movie' ? (item as Movie).release_date : (item as TVShow).first_air_date;
    
    const watchlistItem: WatchlistItem = {
      id: item.id,
      title,
      overview: item.overview || '',
      poster_path: item.poster_path || null,
      backdrop_path: item.backdrop_path || null,
      year: releaseDate ? new Date(releaseDate).getFullYear() : new Date().getFullYear(),
      vote_average: item.vote_average || 0,
      vote_count: item.vote_count || 0,
      type,
      dateAdded: new Date().toISOString(),
      isWatched: false,
      notes: '',
      priority: 'medium'
    };

    // Verificar si ya existe
    const exists = this.watchlist.find(w => w.id === item.id && w.type === type);
    if (exists) {
      console.log('⚠️ Item already in watchlist:', title);
      return false;
    }

    // Agregar al principio de la lista
    this.watchlist.unshift(watchlistItem);
    this.saveToStorage();
    this.notifyListeners();
    
    console.log('✅ Added to watchlist:', title, 'Total items:', this.watchlist.length);
    return true;
  }

  // Remover elemento de la watchlist
  removeFromWatchlist(id: number, type: 'movie' | 'tv'): boolean {
    const initialLength = this.watchlist.length;
    this.watchlist = this.watchlist.filter(item => !(item.id === id && item.type === type));
    
    if (this.watchlist.length < initialLength) {
      this.saveToStorage();
      this.notifyListeners();
      console.log('🗑️ Removed from watchlist, Total items:', this.watchlist.length);
      return true;
    }
    return false;
  }

  // Marcar como visto/no visto
  toggleWatched(id: number, type: 'movie' | 'tv'): boolean {
    const item = this.watchlist.find(w => w.id === id && w.type === type);
    if (item) {
      item.isWatched = !item.isWatched;
      if (item.isWatched) {
        item.dateWatched = new Date().toISOString();
      } else {
        delete item.dateWatched;
      }
      this.saveToStorage();
      this.notifyListeners();
      console.log(`${item.isWatched ? '✅' : '⏳'} Toggled watched status:`, item.title);
      return true;
    }
    return false;
  }

  // Actualizar prioridad
  setPriority(id: number, type: 'movie' | 'tv', priority: 'high' | 'medium' | 'low'): boolean {
    const item = this.watchlist.find(w => w.id === id && w.type === type);
    if (item && ['high', 'medium', 'low'].includes(priority)) {
      item.priority = priority;
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Actualizar notas
  updateNotes(id: number, type: 'movie' | 'tv', notes: string): boolean {
    const item = this.watchlist.find(w => w.id === id && w.type === type);
    if (item) {
      item.notes = notes || '';
      this.saveToStorage();
      // No notificar cambios por notas para evitar re-renders excesivos
      return true;
    }
    return false;
  }

  // Verificar si un elemento está en la watchlist
  isInWatchlist(id: number, type: 'movie' | 'tv'): boolean {
    return this.watchlist.some(item => item.id === id && item.type === type);
  }

  // Obtener estadísticas
  getStats(): WatchlistStats {
    const total = this.watchlist.length;
    const watched = this.watchlist.filter(item => item.isWatched).length;
    const unwatched = total - watched;
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
      unwatched,
      movies,
      tvShows,
      avgRating,
      watchedAvgRating
    };
  }

  // Sistema de suscripciones para componentes reactivos
  subscribe(callback: WatchlistListener): () => void {
    this.listeners.add(callback);
    // Devolver función de cleanup
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notificar a todos los listeners
  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(callback => {
      try {
        callback([...this.watchlist], stats);
      } catch (error) {
        console.error('❌ Error in watchlist listener:', error);
      }
    });
  }

  // Limpiar toda la watchlist (útil para testing)
  clear(): void {
    this.watchlist = [];
    this.saveToStorage();
    this.notifyListeners();
    console.log('🧹 Watchlist cleared');
  }
}

// Crear instancia global
export const watchlistStore = new WatchlistStore();

// Exponer globalmente para debugging
if (typeof window !== 'undefined') {
  (window as any).watchlistStore = watchlistStore;
}

// Sistema de eventos del navegador para comunicación entre frameworks
export const WatchlistEvents = {
  ADD_TO_WATCHLIST: 'watchlist:add',
  REMOVE_FROM_WATCHLIST: 'watchlist:remove',
  TOGGLE_WATCHED: 'watchlist:toggle',
  UPDATE_WATCHLIST: 'watchlist:update',

  // Configurar listeners globales
  setupGlobalListeners(): void {
    if (typeof window === 'undefined') return;

    // Listener para agregar elementos (evento legacy)
    window.addEventListener('addToWatchlist', ((event: CustomEvent) => {
      const { item, type } = event.detail;
      console.log('📡 Received legacy addToWatchlist event:', item.title || item.name, type);
      watchlistStore.addToWatchlist(item, type);
    }) as EventListener);

    // Listeners para eventos nuevos
    window.addEventListener(this.ADD_TO_WATCHLIST, ((event: CustomEvent) => {
      const { item, type } = event.detail;
      console.log('📡 Received addToWatchlist event:', item.title || item.name, type);
      watchlistStore.addToWatchlist(item, type);
    }) as EventListener);

    window.addEventListener(this.REMOVE_FROM_WATCHLIST, ((event: CustomEvent) => {
      const { id, type } = event.detail;
      console.log('📡 Received removeFromWatchlist event:', id, type);
      watchlistStore.removeFromWatchlist(id, type);
    }) as EventListener);

    window.addEventListener(this.TOGGLE_WATCHED, ((event: CustomEvent) => {
      const { id, type } = event.detail;
      console.log('📡 Received toggleWatched event:', id, type);
      watchlistStore.toggleWatched(id, type);
    }) as EventListener);

    console.log('🔧 Global watchlist event listeners setup complete');
  }
};

// Auto-setup cuando se carga el módulo en el browser
if (typeof window !== 'undefined') {
  console.log('🔧 Setting up watchlist system...');
  
  // Setup inmediato
  WatchlistEvents.setupGlobalListeners();
  
  // También setup cuando el DOM esté listo si no lo está ya
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔧 DOM loaded - Re-setting up watchlist listeners');
      WatchlistEvents.setupGlobalListeners();
    });
  }
  
  // Exponer globalmente para debugging DESPUÉS de setup
  (window as any).watchlistStore = watchlistStore;
  (window as any).WatchlistEvents = WatchlistEvents;
  
  console.log('✅ Watchlist system initialized with', watchlistStore.getWatchlist().length, 'items');
}