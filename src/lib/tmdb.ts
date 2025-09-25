import type{ Movie, TVShow, TMDBResponse } from "../types/movies.ts";

const API_KEY = '4c13d79da36a97c80e70be9f823eb0ac';

const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

export class TMDBApi {
  private async fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {

    const searchParams = new URLSearchParams({
      api_key: API_KEY,
      language: 'es-ES',
      ...params
    });

    const url = `${BASE_URL}${endpoint}?${searchParams}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('API Key inválida. Verifica tu configuración en src/lib/tmdb.ts');
        }
        throw new Error(`Error ${response.status}: ${errorData.status_message || response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getPopularMovies(): Promise<TMDBResponse<Movie>> {
    return this.fetchData<TMDBResponse<Movie>>('/movie/popular');
  }

  async getTopRatedMovies(): Promise<TMDBResponse<Movie>> {
    return this.fetchData<TMDBResponse<Movie>>('/movie/top_rated');
  }

  async getTrendingMovies(): Promise<TMDBResponse<Movie>> {
    return this.fetchData<TMDBResponse<Movie>>('/trending/movie/day');
  }

  async getPopularTVShows(): Promise<TMDBResponse<TVShow>> {
    return this.fetchData<TMDBResponse<TVShow>>('/tv/popular');
  }

  async getTopRatedTVShows(): Promise<TMDBResponse<TVShow>> {
    return this.fetchData<TMDBResponse<TVShow>>('/tv/top_rated');
  }

  async getTrendingTVShows(): Promise<TMDBResponse<TVShow>> {
    return this.fetchData<TMDBResponse<TVShow>>('/trending/tv/day');
  }

  async searchMovies(query: string): Promise<TMDBResponse<Movie>> {
    if (!query?.trim()) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
    return this.fetchData<TMDBResponse<Movie>>('/search/movie', { 
      query: query.trim() 
    });
  }

  async searchTVShows(query: string): Promise<TMDBResponse<TVShow>> {
    if (!query?.trim()) {
      return { page: 1, results: [], total_pages: 0, total_results: 0 };
    }
    return this.fetchData<TMDBResponse<TVShow>>('/search/tv', { 
      query: query.trim() 
    });
  }
}

export const tmdbApi = new TMDBApi();