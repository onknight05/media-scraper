import { useState, useEffect, useCallback } from 'react';
import { ScrapeStatus } from '../types';
import type { ScrapeSource } from '../types';
import { getSources, rescrapeSource, deleteSource, deleteAllSources } from '../services/api';
import Pagination from './Pagination';
import Toast from './Toast';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../hooks/useToast';
import FilterBar from './FilterBar';

const STATUS_STYLES: Record<ScrapeStatus, string> = {
  [ScrapeStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
  [ScrapeStatus.SCRAPING]: 'bg-blue-100 text-blue-700',
  [ScrapeStatus.COMPLETED]: 'bg-green-100 text-green-700',
  [ScrapeStatus.FAILED]: 'bg-red-100 text-red-700',
};

interface SourceRowProps {
  source: ScrapeSource;
  onRescrape: (id: string) => void;
  onDelete: (id: string) => void;
}

function SourceRow({ source, onRescrape, onDelete }: SourceRowProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setActionLoading(action);
    try {
      await fn();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${STATUS_STYLES[source.status]}`}>
          {source.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {source.url}
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 text-center">
        {source.mediaCount}
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
        {source.lastScrapedAt ? new Date(source.lastScrapedAt).toLocaleString() : '—'}
      </td>
      <td className="px-4 py-3 text-sm text-red-500 max-w-48 truncate" title={source.error || undefined}>
        {source.error || '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAction('rescrape', () => onRescrape(source.id) as unknown as Promise<void>)}
            disabled={actionLoading !== null}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 cursor-pointer"
          >
            {actionLoading === 'rescrape' ? 'Rescraping...' : 'Rescrape'}
          </button>
          <button
            onClick={() => handleAction('delete', () => onDelete(source.id) as unknown as Promise<void>)}
            disabled={actionLoading !== null}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
          >
            {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function SourceList() {
  const [sources, setSources] = useState<ScrapeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const { toasts, addToast, removeToast } = useToast();
  const [type, setType] = useState<ScrapeStatus | undefined>();
  const [search, setSearch] = useState('');

  const fetchSources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSources({ page, limit: 20, status: type, search });
      setSources(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (error) {
      setSources([]);
      addToast('Failed to load sources.', 'error', error);
    } finally {
      setLoading(false);
    }
  }, [page, type, search, addToast]);

  const handleTypeChange = (newType: ScrapeStatus | undefined) => {
    setType(newType);
    setPage(1);
  };

  const handleSearchChange = useCallback((newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const confirmDeleteAll = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      await deleteAllSources();
      setSources([]);
      setTotalPages(0);
      setTotal(0);
    } catch (error) {
      addToast('Failed to delete all sources.', 'error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRescrape = async (id: string) => {
    try {
      await rescrapeSource(id);
      fetchSources();
    } catch (error) {
      addToast('Failed to rescrape source.', 'error', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSource(id);
      fetchSources();
    } catch (error) {
      addToast('Failed to delete source.', 'error', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Source URLs</h2>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FilterBar
          type={type}
          typeOptions={[
            { label: 'All', value: undefined },
            { label: 'Pending', value: ScrapeStatus.PENDING },
            { label: 'Scraping', value: ScrapeStatus.SCRAPING },
            { label: 'Completed', value: ScrapeStatus.COMPLETED },
            { label: 'Failed', value: ScrapeStatus.FAILED },
          ]}
          placeholder='Search source by url'
          search={search}
          onTypeChange={handleTypeChange}
          onSearchChange={handleSearchChange}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSources}
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
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-12" />
              <div className="h-4 bg-gray-200 rounded w-1/6" />
            </div>
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">No source URLs found. Submit URLs above to start scraping.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">URL</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase text-center">Media</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Last Scraped</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Error</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  onRescrape={handleRescrape}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete All Sources"
          message="Are you sure you want to delete all sources? This action cannot be undone."
          confirmLabel="Delete All"
          onConfirm={confirmDeleteAll}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
