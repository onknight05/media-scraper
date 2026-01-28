import fs from 'fs';
import path from 'path';
import { parseMediaFromHtml } from '../src/modules/scraper/utils/scraper.util';

describe('Scraper unit test', () => {
  test('parseMediaFromHtml should extract media items correctly', () => {
    const htmlContent = fs.readFileSync(
      path.resolve(__dirname, '911.html'),
      'utf-8'
    );
    const sourceUrl = 'https://archive.org/details/911';

    const mediaItems = parseMediaFromHtml(htmlContent, sourceUrl);
    console.log(mediaItems);
    expect(mediaItems.length).toBeGreaterThan(0);
  });
});