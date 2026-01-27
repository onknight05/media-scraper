import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapedMedia } from './entities/scraped-media.entity';
import { ScrapeRequestDto } from './dto/scrape-request.dto';
import { PaginatedMediaResponseDto, ScrapeResponseDto } from './dto/media-response.dto';
import { GetMediaQueryDto } from './dto/get-media-query.dto';
import { extractMediaItemsFromUrl } from './utils/scraper.util';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectRepository(ScrapedMedia)
    private readonly mediaRepository: Repository<ScrapedMedia>
  ) {}

  async scrapeUrls(dto: ScrapeRequestDto): Promise<ScrapeResponseDto> {
    const { urls } = dto;

    // TODO: remove duplicates.
    // TODO: use a job queue for better scalability.
    // Process URLs asynchronously (fire and forget for now)
    // In production, this should use a queue (Bull/Redis)
    this.processUrlsAsync(urls);

    return {
      message: 'Scraping started',
      urlsQueued: urls.length,
    };
  }

  private async processUrlsAsync(urls: string[]): Promise<void> {
    for (const url of urls) {
      try {
        await this.scrapeUrl(url);
      } catch (error) {
        this.logger.error(`Failed to scrape ${url}`, error);
      }
    }
  }

  private async scrapeUrl(sourceUrl: string): Promise<void> {
    this.logger.log(`Scraping: ${sourceUrl}`);

    try {
      const mediaItems = await extractMediaItemsFromUrl(sourceUrl);

      // Save to database
      if (mediaItems.length > 0) {
        const entities = mediaItems.map((item) =>
          this.mediaRepository.create({
            ...item,
            sourceUrl,
          })
        );
        await this.mediaRepository.save(entities);
        this.logger.log(`Saved ${entities.length} media items from ${sourceUrl}`);
      }
    } catch (error) {
      this.logger.error(`Error scraping ${sourceUrl}`, error);
      throw error;
    }
  }

  async getMedia(query: GetMediaQueryDto): Promise<PaginatedMediaResponseDto> {
    const { type, search, page = 1, limit = 20 } = query;

    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(media.title ILIKE :search OR media.alt ILIKE :search OR media.url ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('media.createdAt', 'DESC');

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMediaById(id: string): Promise<ScrapedMedia | null> {
    return this.mediaRepository.findOne({ where: { id } });
  }

  async deleteMedia(id: string) {
    const result = await this.mediaRepository.delete(id);
    return result.affected;
  }
}
