import { MediaType } from '../entities/scraped-media.entity';

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
  // Dynamic import
  const axios = await import('axios');
  const cheerio = await import('cheerio');

  const response = await axios.default.get(sourceUrl, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const $ = cheerio.load(response.data);
  const mediaItems: ScrapedMediaItem[] = [];

  // Extract images
  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      const absoluteUrl = resolveUrl(src, sourceUrl);
      if (absoluteUrl) {
        mediaItems.push({
          url: absoluteUrl,
          type: MediaType.IMAGE,
          title: $(element).attr('title') || undefined,
          alt: $(element).attr('alt') || undefined,
        });
      }
    }
  });

  // Extract videos
  $('video source, video').each((_, element) => {
    const src = $(element).attr('src');
    if (src) {
      const absoluteUrl = resolveUrl(src, sourceUrl);
      if (absoluteUrl) {
        mediaItems.push({
          url: absoluteUrl,
          type: MediaType.VIDEO,
          title: $(element).attr('title') || undefined,
          alt: undefined,
        });
      }
    }
  });

  // Extract video iframes (YouTube, Vimeo, etc.)
  $('iframe').each((_, element) => {
    const src = $(element).attr('src');
    if (src && isVideoEmbed(src)) {
      mediaItems.push({
        url: src,
        type: MediaType.VIDEO,
        title: $(element).attr('title') || undefined,
        alt: undefined,
      });
    }
  });
  return mediaItems;
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
