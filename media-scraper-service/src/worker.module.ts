import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { getDatabaseConfig } from '@config/database.config';
import { APP_CONFIG } from '@config/app.config';
import { ScrapedMedia } from '@modules/scraper/entities/scraped-media.entity';
import { ScrapeSource } from '@modules/scraper/entities/scrape-source.entity';
import { ScraperQueueConsumer } from '@/modules/queues/scraper.queue';
import { SCRAPER_QUEUE } from '@modules/scraper/scraper.constants';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: getDatabaseConfig,
    }),
    BullModule.forRoot({
      connection: {
        host: APP_CONFIG.REDIS_HOST,
        port: APP_CONFIG.REDIS_PORT,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    BullModule.registerQueue({ name: SCRAPER_QUEUE }),
    TypeOrmModule.forFeature([ScrapedMedia, ScrapeSource]),
  ],
  providers: [ScraperQueueConsumer],
})
export class WorkerModule {}
