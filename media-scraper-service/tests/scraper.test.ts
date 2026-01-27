import { extractMediaItemsFromUrl } from '../src/modules/scraper/utils/scraper.util';

const originalFetch = global.fetch;
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Scraper unit test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('extractMediaItemsFromUrl should extract media items correctly', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <body>
            <img src="http://domain1.com/image1.jpg" />
            <video src="http://domain2.com/video1.mp4"></video>
            <img src="/images/image2.jpg" />
            <video src="/videos/video2.mp4"></video>
          </body>
        </html>
      `,
    });

    const mediaItems = await extractMediaItemsFromUrl('http://example.com');

    expect(mediaItems).toEqual([
      { url: 'http://domain1.com/image1.jpg', type: 'image' },
      { url: 'http://example.com/images/image2.jpg', type: 'image' },
      { url: 'http://domain2.com/video1.mp4', type: 'video' },
      { url: 'http://example.com/videos/video2.mp4', type: 'video' },
    ]);
  });

  test('extractMediaItemsFromUrl should handle no media found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => `
        <html>
          <body>
            <p>No media here!</p>
          </body>
        </html>
      `,
    });

    const mediaItems = await extractMediaItemsFromUrl('http://example.com');

    expect(mediaItems).toEqual([]);
  });

  test('extractMediaItemsFromUrl should handle request failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network Error'));

    await expect(extractMediaItemsFromUrl('http://example.com')).rejects.toThrow('Network Error');
  });

  // real online url
  test('extractMediaItemsFromUrl should extract media from real URL', async () => {
    // Use real implementation for this test
    global.fetch = originalFetch;
    const urls = [
      'https://www.wikipedia.org/',
      'https://unsplash.com/s/photos/city',
    ];
    const mediaItems = [];
    for (const url of urls) {
      const items = await extractMediaItemsFromUrl(url);
      mediaItems.push(...items);
    }
    console.log(mediaItems);
    // expect at least one image that logo of wikipedia
    expect(mediaItems.length).toBeGreaterThan(0);
    expect(
      mediaItems.some(
        (item) => item.type === 'image' && item.url.includes('https://www.wikipedia.org/')
      )
    ).toBe(true);
  });

  // real axios to un-reachable url
  test('extractMediaItemsFromUrl should handle request failure getaddrinfo', async () => {
    // Use real implementation for this test
    global.fetch = originalFetch;

    await expect(extractMediaItemsFromUrl('https://www.unreachable.org/')).rejects.toThrow();
  });
});
