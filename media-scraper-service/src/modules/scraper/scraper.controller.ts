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
import { GetMediaQueryDto } from './dto/get-media-query.dto';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @Post('scrape')
  @HttpCode(HttpStatus.ACCEPTED)
  async scrape(@Body() dto: ScrapeRequestDto): Promise<ScrapeResponseDto> {
    return this.scraperService.scrapeUrls(dto);
  }

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
}
