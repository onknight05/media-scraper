import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScrapeRequestDto } from './dto/scrape-request.dto';
import {
  MediaResponseDto,
  PaginatedMediaResponseDto,
  ScrapeResponseDto,
} from './dto/media-response.dto';
import { PaginatedSourceResponseDto, SourceResponseDto } from './dto/source-response.dto';
import { GetMediaQueryDto } from './dto/get-media-query.dto';
import { GetSourcesQueryDto } from './dto/get-sources-query.dto';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // --- Scrape ---

  @Post('scrape')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrape(@Body() dto: ScrapeRequestDto): Promise<ScrapeResponseDto> {
    return this.scraperService.scrapeUrls(dto);
  }

  @Post('scrape/all')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrapeAll(): Promise<ScrapeResponseDto> {
    return this.scraperService.scrapeAllUrls();
  }

  // --- Sources ---

  @Get('sources')
  async getSources(@Query() query: GetSourcesQueryDto): Promise<PaginatedSourceResponseDto> {
    return this.scraperService.getSources(query);
  }

  @Post('sources/:id/rescrape')
  @HttpCode(HttpStatus.ACCEPTED)
  async rescrapeSource(@Param('id', ParseUUIDPipe) id: string): Promise<SourceResponseDto> {
    const source = await this.scraperService.rescrapeSource(id);
    if (!source) {
      throw new NotFoundException('Source not found');
    }
    return source;
  }

  @Delete('sources/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSource(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const deleted = await this.scraperService.deleteSource(id);
    if (!deleted) {
      throw new NotFoundException('Source not found');
    }
  }

  @Delete('sources/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllSources(): Promise<void> {
    await this.scraperService.deleteAllSources();
  }

  // --- Media ---

  @Get('media')
  async getMedia(@Query() query: GetMediaQueryDto): Promise<PaginatedMediaResponseDto> {
    return this.scraperService.getMedia(query);
  }

  @Get('media/:id')
  async getMediaById(@Param('id', ParseUUIDPipe) id: string): Promise<MediaResponseDto> {
    const media = await this.scraperService.getMediaById(id);
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    return media;
  }

  @Delete('media/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMedia(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const deleted = await this.scraperService.deleteMedia(id);
    if (!deleted) {
      throw new NotFoundException('Media not found');
    }
  }

  @Delete('media/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllMedia(): Promise<void> {
    await this.scraperService.deleteAllMedia();
  }
}
