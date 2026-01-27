import { ScrapeStatus } from '../entities/scrape-source.entity';

export class SourceResponseDto {
  id: string;
  url: string;
  status: ScrapeStatus;
  mediaCount: number;
  error: string | null;
  lastScrapedAt: Date | null;
  createdAt: Date;
}

export class PaginatedSourceResponseDto {
  data: SourceResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
