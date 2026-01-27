import { MediaType } from '../entities/scraped-media.entity';

export class MediaResponseDto {
  id: string;
  url: string;
  type: MediaType;
  sourceUrl: string;
  title: string | null;
  alt: string | null;
  createdAt: Date;
}

export class PaginatedMediaResponseDto {
  data: MediaResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ScrapeResponseDto {
  message: string;
  jobId?: string;
  urlsQueued: number;
}
