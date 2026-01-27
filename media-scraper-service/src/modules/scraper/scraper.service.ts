import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScrapedMedia } from './entities/scraped-media.entity';
import { ScrapeSource, ScrapeStatus } from './entities/scrape-source.entity';
import { ScrapeRequestDto } from './dto/scrape-request.dto';
import { PaginatedMediaResponseDto, ScrapeResponseDto } from './dto/media-response.dto';
import { PaginatedSourceResponseDto } from './dto/source-response.dto';
import { GetMediaQueryDto } from './dto/get-media-query.dto';
import { GetSourcesQueryDto } from './dto/get-sources-query.dto';
import { extractMediaItemsFromUrl } from './utils/scraper.util';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    @InjectRepository(ScrapedMedia)
    private readonly mediaRepository: Repository<ScrapedMedia>,
    @InjectRepository(ScrapeSource)
    private readonly sourceRepository: Repository<ScrapeSource>
  ) {}

  async scrapeUrls(dto: ScrapeRequestDto): Promise<ScrapeResponseDto> {
    const { urls } = dto;

    // Upsert sources — reset failed ones to pending
    const sources: ScrapeSource[] = [];
    for (const url of urls) {
      let source = await this.sourceRepository.findOne({ where: { url } });
      if (source) {
        source.status = ScrapeStatus.PENDING;
        source.error = null as unknown as string;
      } else {
        source = this.sourceRepository.create({ url });
      }
      sources.push(await this.sourceRepository.save(source));
    }

    this.processSourcesAsync(sources);

    return {
      message: 'Scraping started',
      urlsQueued: sources.length,
    };
  }

  async scrapeAllUrls(): Promise<ScrapeResponseDto> {
    const sources = await this.sourceRepository.find();
    this.processSourcesAsync(sources);

    return {
      message: 'Scraping started for all sources',
      urlsQueued: sources.length,
    };
  }

  private async processSourcesAsync(sources: ScrapeSource[]): Promise<void> {
    for (const source of sources) {
      try {
        await this.scrapeSource(source);
      } catch (error) {
        this.logger.error(`Failed to scrape ${source.url}`, error);
      }
    }
  }

  private async scrapeSource(source: ScrapeSource): Promise<void> {
    this.logger.log(`Scraping: ${source.url}`);

    source.status = ScrapeStatus.SCRAPING;
    await this.sourceRepository.save(source);

    try {
      const mediaItems = await extractMediaItemsFromUrl(source.url);

      if (mediaItems.length > 0) {
        const entities = mediaItems.map((item) =>
          this.mediaRepository.create({
            ...item,
            sourceUrl: source.url,
          })
        );
        await this.mediaRepository.save(entities);
        this.logger.log(`Saved ${entities.length} media items from ${source.url}`);
      }

      source.status = ScrapeStatus.COMPLETED;
      source.mediaCount = mediaItems.length;
      source.error = null as unknown as string;
      source.lastScrapedAt = new Date();
      await this.sourceRepository.save(source);
    } catch (error) {
      source.status = ScrapeStatus.FAILED;
      source.error = error instanceof Error ? error.message : String(error);
      await this.sourceRepository.save(source);
      throw error;
    }
  }

  async rescrapeSource(id: string): Promise<ScrapeSource | null> {
    const source = await this.sourceRepository.findOne({ where: { id } });
    if (!source) return null;

    // Delete old media from this source
    await this.mediaRepository.delete({ sourceUrl: source.url });

    source.status = ScrapeStatus.PENDING;
    source.error = null as unknown as string;
    source.mediaCount = 0;
    await this.sourceRepository.save(source);

    this.processSourcesAsync([source]);

    return source;
  }

  // --- Sources CRUD ---

  async getSources(query: GetSourcesQueryDto): Promise<PaginatedSourceResponseDto> {
    const { status, search, page = 1, limit = 20 } = query;

    const qb = this.sourceRepository.createQueryBuilder('source');

    if (status) {
      qb.andWhere('source.status = :status', { status });
    }

    if (search) {
      qb.andWhere('source.url ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy('source.createdAt', 'DESC');

    const total = await qb.getCount();
    const data = await qb
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

  async deleteSource(id: string) {
    const source = await this.sourceRepository.findOne({ where: { id } });
    if (!source) return 0;

    // Delete associated media
    await this.mediaRepository.delete({ sourceUrl: source.url });

    const result = await this.sourceRepository.delete(id);
    return result.affected;
  }

  async deleteAllSources() {
    return this.sourceRepository.clear();
  }

  // --- Media CRUD ---

  async getMedia(query: GetMediaQueryDto): Promise<PaginatedMediaResponseDto> {
    const { type, search, page = 1, limit = 20 } = query;

    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    if (search) {
      queryBuilder.andWhere(
        '(media.title ILIKE :search OR media.alt ILIKE :search OR media.url ILIKE :search OR media.sourceUrl ILIKE :search)',
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

  async deleteAllMedia() {
    return this.mediaRepository.clear();
  }
}
