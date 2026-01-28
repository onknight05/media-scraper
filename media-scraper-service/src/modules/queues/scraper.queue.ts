import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { ScrapedMedia } from '../scraper/entities/scraped-media.entity';
import { ScrapeSource, ScrapeStatus } from '../scraper/entities/scrape-source.entity';
import { extractMediaItemsFromUrl } from '../scraper/utils/scraper.util';
import { APP_CONFIG } from '@config/app.config';
import { SCRAPER_QUEUE, ScrapeJobData } from '../scraper/scraper.constants';
import { MetricsService } from '../metrics/metrics.service';

@Processor(SCRAPER_QUEUE, {
  concurrency: APP_CONFIG.SCRAPER_CONCURRENCY,
})
export class ScraperQueueConsumer extends WorkerHost {
  private readonly logger = new Logger(ScraperQueueConsumer.name);

  constructor(
    @InjectRepository(ScrapedMedia)
    private readonly mediaRepository: Repository<ScrapedMedia>,
    @InjectRepository(ScrapeSource)
    private readonly sourceRepository: Repository<ScrapeSource>,
    private readonly metricsService: MetricsService,
  ) {
    super();
  }

  async process(job: Job<ScrapeJobData>): Promise<number> {
    const { sourceId, url } = job.data;
    this.logger.log(`Processing job ${job.id}: scraping ${url}`);

    const timer = this.metricsService.jobProcessingDuration.startTimer();

    const source = await this.sourceRepository.findOne({ where: { id: sourceId } });
    if (!source) {
      this.logger.warn(`Source ${sourceId} not found, skipping job`);
      timer({ status: 'skipped' });
      this.metricsService.jobTotal.inc({ status: 'skipped' });
      return 0;
    }

    source.status = ScrapeStatus.SCRAPING;
    await this.sourceRepository.save(source);

    try {
      const mediaItems = await extractMediaItemsFromUrl(url);

      if (mediaItems.length > 0) {
        const entities = mediaItems.map((item) =>
          this.mediaRepository.create({
            ...item,
            sourceUrl: source.url,
          }),
        );

        // Batch insert in chunks to avoid memory spikes
        const BATCH_SIZE = 100;
        for (let i = 0; i < entities.length; i += BATCH_SIZE) {
          const batch = entities.slice(i, i + BATCH_SIZE);
          await this.mediaRepository.save(batch);
        }

        this.logger.log(`Saved ${entities.length} media items from ${url}`);
      }

      source.status = ScrapeStatus.COMPLETED;
      source.mediaCount = mediaItems.length;
      source.error = null as unknown as string;
      source.lastScrapedAt = new Date();
      await this.sourceRepository.save(source);

      timer({ status: 'completed' });
      this.metricsService.jobTotal.inc({ status: 'completed' });
      this.metricsService.jobMediaExtracted.observe(mediaItems.length);

      return mediaItems.length;
    } catch (error) {
      source.status = ScrapeStatus.FAILED;
      source.error = error instanceof Error ? error.message : String(error);
      await this.sourceRepository.save(source);

      timer({ status: 'failed' });
      this.metricsService.jobTotal.inc({ status: 'failed' });

      throw error;
    }
  }
}
