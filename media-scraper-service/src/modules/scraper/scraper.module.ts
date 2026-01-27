import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScrapedMedia } from './entities/scraped-media.entity';
import { ScrapeSource } from './entities/scrape-source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapedMedia, ScrapeSource])],
  controllers: [ScraperController],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
