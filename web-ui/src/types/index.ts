export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum ScrapeStatus {
  PENDING = 'pending',
  SCRAPING = 'scraping',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ScrapedMedia {
  id: string;
  url: string;
  type: MediaType;
  sourceUrl: string;
  title: string | null;
  alt: string | null;
  createdAt: string;
}

export interface ScrapeSource {
  id: string;
  url: string;
  status: ScrapeStatus;
  mediaCount: number;
  error: string | null;
  lastScrapedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ScrapeResponse {
  message: string;
  jobId?: string;
  urlsQueued: number;
}

export interface MediaQuery {
  type?: MediaType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface SourceQuery {
  status?: ScrapeStatus;
  search?: string;
  page?: number;
  limit?: number;
}
