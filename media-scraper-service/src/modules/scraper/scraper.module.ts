import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperController } from './scraper.controller';
import { ScraperService } from './scraper.service';
import { ScrapedMedia } from './entities/scraped-media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScrapedMedia])],
  controllers: [ScraperController],
  providers: [ScraperService],
  exports: [ScraperService],
})
export class ScraperModule {}
