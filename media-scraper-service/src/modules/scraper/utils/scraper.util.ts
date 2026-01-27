import { MediaType } from '../entities/scraped-media.entity';
import * as cheerio from 'cheerio';

export interface ScrapedMediaItem {
  url: string;
  type: MediaType;
  title?: string;
  alt?: string;
}

/**
 * Exposed for testing purposes.
 * @param sourceUrl
 * @returns
 */
export async function extractMediaItemsFromUrl(sourceUrl: string): Promise<ScrapedMediaItem[]> {
  const content = await customFetchContent(sourceUrl);
  const $ = cheerio.load(content);
  const mediaItems: ScrapedMediaItem[] = [];
  const checked = new Set<string>();

  // Extract images
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      const absoluteUrl = resolveUrl(src, sourceUrl);
      if (absoluteUrl && !checked.has(`img:${absoluteUrl}`)) {
        mediaItems.push({
          url: absoluteUrl,
          type: MediaType.IMAGE,
          title: $(element).attr('title') || undefined,
          alt: $(element).attr('alt') || undefined,
        });
        checked.add(`img:${absoluteUrl}`);
      }
    }
  });

  // Extract videos
  $('video source, video').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      const absoluteUrl = resolveUrl(src, sourceUrl);
      if (absoluteUrl && !checked.has(`video:${absoluteUrl}`)) {
        mediaItems.push({
          url: absoluteUrl,
          type: MediaType.VIDEO,
          title: $(element).attr('title') || undefined,
          alt: undefined,
        });
        checked.add(`video:${absoluteUrl}`);
      }
    }
  });

  // Extract video iframes (YouTube, Vimeo, etc.)
  $('iframe').each((_, element) => {
    const src = $(element).attr('src');
    if (src && isVideoEmbed(src) && !checked.has(`iframe:${src}`)) {
      mediaItems.push({
        url: src,
        type: MediaType.VIDEO,
        title: $(element).attr('title') || undefined,
        alt: undefined,
      });
      checked.add(`iframe:${src}`);
    }
  });
  return mediaItems;
}

async function customFetchContent(url: string): Promise<string> {
  let result = '';

  const fetchRes = await fetch(url, {
    method: 'GET',
    signal: AbortSignal.timeout(10000),
  });
  if (!fetchRes.ok) {
    // retry with other fetch strategies
    try {
      result = await customGotScraping(url);
      return result;
    } catch (error) {
      throw error;
    }
  }
  result = await fetchRes.text();

  return result;
}

async function customGotScraping(url: string): Promise<string> {
  // Dynamically import to avoid loading got-scraping unless necessary and testing
  const { getGotScraping } = await import('./esm-loader.mjs');
  const gotScraping = await getGotScraping();
  const response = await gotScraping(url, {
    timeout: {request: 10000 },
    retry: { limit: 2 },
  });
  return response.body;
}

function resolveUrl(url: string, baseUrl: string): string | null {
  try {
    if (url.startsWith('data:')) return null;
    return new URL(url, baseUrl).href;
  } catch {
    return null;
  }
}

function isVideoEmbed(url: string): boolean {
  // TODO: add more video hosts or change to a more robust check
  const videoHosts = ['youtube.com'];
  return videoHosts.some((host) => url.includes(host));
}
