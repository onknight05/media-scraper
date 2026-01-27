import axios from 'axios';
import type { PaginatedResponse, ScrapedMedia, ScrapeResponse, MediaQuery } from '../types';

const scraperClient = axios.create({
  baseURL: '/api/scraper',
});

scraperClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data) {
      console.error(error.response.data);
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  },
);

export async function scrapeUrls(urls: string[]): Promise<ScrapeResponse> {
  const { data } = await scraperClient.post<ScrapeResponse>('/scrape', { urls });
  return data;
}

export async function getMedia(query: MediaQuery): Promise<PaginatedResponse<ScrapedMedia>> {
  const { data } = await scraperClient.get<PaginatedResponse<ScrapedMedia>>('/media', {
    params: query,
  });
  return data;
}

export async function deleteMedia(id: string): Promise<void> {
  await scraperClient.delete(`/media/${id}`);
}

export async function deleteAllMedia(): Promise<void> {
  await scraperClient.delete('/media/all');
}
