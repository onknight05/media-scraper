import { useState } from 'react';
import { scrapeUrls } from '../services/api';

interface ScrapeFormProps {
  onScrapeStarted: () => void;
}

export default function ScrapeForm({ onScrapeStarted }: ScrapeFormProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const urls = input
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      setMessage({ text: 'Please enter at least one URL.', isError: true });
      return;
    }

    const invalid = urls.filter((u) => {
      try {
        new URL(u);
        return false;
      } catch {
        return true;
      }
    });

    if (invalid.length > 0) {
      setMessage({ text: `Invalid URLs: ${invalid.join(', ')}`, isError: true });
      return;
    }

    setLoading(true);
    try {
      const res = await scrapeUrls(urls);
      setMessage({ text: `${res.urlsQueued} URL(s) queued for scraping.`, isError: false });
      setInput('');
      onScrapeStarted();
    } catch {
      setMessage({ text: 'Failed to start scraping. Please try again.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <label htmlFor="urls" className="block text-sm font-medium text-gray-700 mb-1">
        Enter URLs to scrape (one per line)
      </label>
      <textarea
        id="urls"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={"https://example.com\nhttps://another-site.com"}
        rows={3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {loading ? 'Scraping...' : 'Scrape'}
        </button>
        {message && (
          <p className={`text-sm ${message.isError ? 'text-red-600' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
