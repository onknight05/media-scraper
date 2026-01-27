import { useState, useEffect, useCallback } from 'react';
import FilterBar from './FilterBar';
import MediaGrid from './MediaGrid';
import Pagination from './Pagination';
import ViewToggle from './ViewToggle';
import type { ViewMode } from './ViewToggle';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';
import { getMedia, deleteMedia, deleteAllMedia } from '../services/api';
import { ScrapedMedia, MediaType } from '../types';

export default function MediaList() {
  const [media, setMedia] = useState<ScrapedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [type, setType] = useState<MediaType | undefined>();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<ViewMode>('grid');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

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
  }, [page, type, search, addToast]);

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

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Scraped Media</h2>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterBar
          type={type}
          typeOptions={[
            { label: 'All', value: undefined },
            { label: 'Images', value: MediaType.IMAGE },
            { label: 'Videos', value: MediaType.VIDEO },
          ]}
          placeholder='Search media by url, title or alt text...'
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
    </>
  );
}
