import { chromium, Browser } from 'playwright';

let browserInstance: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function playwrightFetchDynamicRenderingContent(url: string): Promise<string | null> {
  let page;
  try {
    console.debug(`Fetching dynamic content for ${url} using Playwright`);
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    const content = await page.content();
    console.debug(`Playwright fetched content for ${url}, content length: ${content.length}`);
    // console.debug(`Playwright fetched content for ${url}, content: ${content}`);
    return content;
  } catch (error) {
    console.error(`Playwright fetch failed for ${url}:`, error);
    return null;
  } finally {
    await page?.close();
  }
}