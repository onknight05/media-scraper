import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { SCRAPER_QUEUE } from './scraper.constants';
import { ScrapedMedia } from './entities/scraped-media.entity';
import { ScrapeSource } from './entities/scrape-source.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScrapedMedia, ScrapeSource]),
    BullModule.registerQueue({ name: SCRAPER_QUEUE }),
  ],
  controllers: [ScraperController],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
