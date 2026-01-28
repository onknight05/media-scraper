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
  const useDynamicByURL = shouldUseDynamicRenderingExtractByURL(sourceUrl);
  if (useDynamicByURL) {
    console.log(`Using dynamic rendering extract ${sourceUrl}`);
    const renderedContent = await fetchDynamicRenderingContent(sourceUrl);
    if (renderedContent) {
      return parseMediaFromHtml(renderedContent, sourceUrl);
    }
  }

  const content = await fetchStaticContent(sourceUrl);
  const mediaItems = parseMediaFromHtml(content, sourceUrl);

  // Fallback: if no media found, the page may be JS-rendered
  if (mediaItems.length === 0 && shouldUseDynamicRenderingExtractByContent(content)) {
    console.log(`No media found with static fetch, trying dynamic extract ${sourceUrl}`);
    const renderedContent = await fetchDynamicRenderingContent(sourceUrl);
    if (renderedContent) {
      return parseMediaFromHtml(renderedContent, sourceUrl);
    }
  }

  return mediaItems;
}

async function fetchStaticContent(url: string): Promise<string> {
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

async function fetchDynamicRenderingContent(url: string): Promise<string | null> {
  // Dynamically import to avoid loading Playwright unless necessary and testing
  const { playwrightFetchDynamicRenderingContent } = await import('./playwright.util');
  return playwrightFetchDynamicRenderingContent(url);
}

export function parseMediaFromHtml(html: string, sourceUrl: string): ScrapedMediaItem[] {
  const $ = cheerio.load(html);
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

  // Extract videos from <play-av> playlist attribute (e.g. Internet Archive's JWPlayer)
  $('play-av[playlist]').each((_, element) => {
    const playlistAttr = $(element).attr('playlist');
    if (!playlistAttr) return;
    try {
      const playlist = JSON.parse(playlistAttr) as Array<{ file?: string; title?: string }>;
      for (const item of playlist) {
        if (item.file) {
          const absoluteUrl = resolveUrl(item.file, sourceUrl);
          if (absoluteUrl && !checked.has(`video:${absoluteUrl}`)) {
            mediaItems.push({
              url: absoluteUrl,
              type: MediaType.VIDEO,
              title: item.title || undefined,
              alt: undefined,
            });
            checked.add(`video:${absoluteUrl}`);
          }
        }
      }
    } catch {
      // ignore malformed playlist JSON
    }
  });

  return mediaItems;
}

function shouldUseDynamicRenderingExtractByURL(url: string): boolean {
  const dynamicSites = ['youtube.com', 'vimeo.com', 'facebook.com', 'instagram.com']; // TODO: add more as needed
  return dynamicSites.some((site) => url.includes(site));
}

function shouldUseDynamicRenderingExtractByContent(content: string): boolean {
  const indicators = ['<script', 'window.', 'document.', '<play-av>']; // TODO: refine indicators
  return indicators.some((indicator) => content.includes(indicator));
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
