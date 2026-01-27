export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
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
