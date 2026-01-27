import { useState, useEffect, useCallback, useRef } from 'react';
import ScrapeForm from './components/ScrapeForm';
import FilterBar from './components/FilterBar';
import MediaGrid from './components/MediaGrid';
import Pagination from './components/Pagination';
import ViewToggle from './components/ViewToggle';
import type { ViewMode } from './components/ViewToggle';
import ConfirmModal from './components/ConfirmModal';
import Toast from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { getMedia, deleteMedia, deleteAllMedia } from './services/api';
import type { ScrapedMedia, MediaType } from './types';

function App() {
  const [media, setMedia] = useState<ScrapedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState<MediaType | undefined>();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'error', data?: unknown) => {
    setToasts((prev) => [...prev, { id: Date.now() + toastIdRef.current++, text, type, data }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMedia({ page, limit: 20, type, search: search || undefined });
      setMedia(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (error) {
      setMedia([]);
      addToast('Failed to load media.', 'error', error);
    } finally {
      setLoading(false);
    }
  }, [page, type, search]);

  const confirmDeleteAll = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      await deleteAllMedia();
      setMedia([]);
      setTotalPages(0);
      setTotal(0);
    } catch (error) {
      addToast('Failed to delete all media.', 'error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleTypeChange = (newType: MediaType | undefined) => {
    setType(newType);
    setPage(1);
  };

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteMedia(id);
      fetchMedia();
    } catch (error) {
      addToast('Failed to delete media.', 'error', error);
    }
  };

  const handleScrapeStarted = () => {
    setTimeout(fetchMedia, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Media Scraper</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <ScrapeForm onScrapeStarted={handleScrapeStarted} />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <FilterBar
            type={type}
            search={search}
            onTypeChange={handleTypeChange}
            onSearchChange={handleSearchChange}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={fetchMedia}
              className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-600 hover:text-red-800 cursor-pointer"
            >
              Delete All
            </button>
            <ViewToggle view={view} onChange={setView} />
          </div>
        </div>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        <MediaGrid media={media} loading={loading} view={view} onDelete={handleDelete} />
        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      </main>

      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete All Media"
          message="Are you sure you want to delete all media? This action cannot be undone."
          confirmLabel="Delete All"
          onConfirm={confirmDeleteAll}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
