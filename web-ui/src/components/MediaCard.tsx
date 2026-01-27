import { useState } from 'react';
import type { ScrapedMedia } from '../types';
import { MediaType } from '../types';

interface MediaCardProps {
  media: ScrapedMedia;
  onDelete: (id: string) => void;
}

export default function MediaCard({ media, onDelete }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
      <div className="aspect-video bg-gray-100 relative">
        {media.type === MediaType.IMAGE ? (
          imgError ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Failed to load image
            </div>
          ) : (
            <img
              src={media.url}
              alt={media.alt || media.title || 'Scraped image'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <a
              href={media.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span className="text-sm">Play Video</span>
            </a>
          </div>
        )}

        <span className="absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded bg-black/60 text-white uppercase">
          {media.type}
        </span>
      </div>

      <div className="p-3">
        {(media.title || media.alt) && (
          <p className="text-sm text-gray-800 font-medium truncate mb-1">
            {media.title || media.alt}
          </p>
        )}
        <p className="text-xs text-gray-400 truncate mb-2" title={media.sourceUrl}>
          {media.sourceUrl}
        </p>
        <div className="flex items-center justify-between">
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Open original
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
