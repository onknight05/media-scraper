import { useState } from 'react';
import type { ScrapedMedia } from '../types';
import { MediaType } from '../types';
import type { ViewMode } from './ViewToggle';
import MediaCard from './MediaCard';

interface MediaGridProps {
  media: ScrapedMedia[];
  loading: boolean;
  view: ViewMode;
  onDelete: (id: string) => void;
}

function MediaListRow({ media, onDelete }: { media: ScrapedMedia; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(media.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
            media.type === MediaType.IMAGE
              ? 'bg-green-100 text-green-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {media.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <a
          href={media.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline break-all"
        >
          {media.url}
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-48 truncate">
        {media.title || media.alt || '—'}
      </td>
      <td className="px-4 py-3">
        <a
          href={media.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:underline break-all"
        >
          {media.sourceUrl}
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">
        {new Date(media.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </td>
    </tr>
  );
}

export default function MediaGrid({ media, loading, view, onDelete }: MediaGridProps) {
  if (loading) {
    return view === 'grid' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="aspect-video bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <svg className="mx-auto w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
          />
        </svg>
        <p className="text-lg font-medium">No media found</p>
        <p className="text-sm mt-1">Submit URLs above to start scraping.</p>
      </div>
    );
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item) => (
          <MediaCard key={item.id} media={item} onDelete={onDelete} />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">URL</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Title / Alt</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Source</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Scraped At</th>
            <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase"></th>
          </tr>
        </thead>
        <tbody>
          {media.map((item) => (
            <MediaListRow key={item.id} media={item} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
