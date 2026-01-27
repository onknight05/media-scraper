let gotScraping = null;

export async function getGotScraping() {
  if (!gotScraping) {
    gotScraping ??= (await import('got-scraping')).gotScraping;
  }
  return gotScraping;
}

export async function gotScrapingFetch(url, options = {}) {
  const { gotScraping } = await import('got-scraping');
  return gotScraping({ url, ...options });
}
