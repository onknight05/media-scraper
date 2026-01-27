import { useState } from 'react';
import ScrapeForm from './components/ScrapeForm';
import MediaList from './components/MediaList';
import SourceList from './components/SourceList';

type Tab = 'media' | 'sources';

function App() {
  const [tab, setTab] = useState<Tab>('media');

  const handleScrapeStarted = () => {
    setTab('sources');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'media', label: 'Media' },
    { key: 'sources', label: 'Sources' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Media Scraper</h1>
          <nav className="flex gap-1 bg-gray-100 rounded-md p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 text-sm font-medium rounded cursor-pointer transition-colors ${
                  tab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <ScrapeForm onScrapeStarted={handleScrapeStarted} />

        {tab === 'media' && <MediaList />}
        {tab === 'sources' && <SourceList />}
      </main>
    </div>
  );
}

export default App;
