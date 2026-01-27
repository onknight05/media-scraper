import { useState, useEffect } from 'react';
import { MediaType } from '../types';

interface FilterBarProps {
  type: MediaType | undefined;
  search: string;
  onTypeChange: (type: MediaType | undefined) => void;
  onSearchChange: (search: string) => void;
}

export default function FilterBar({ type, search, onTypeChange, onSearchChange }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, onSearchChange]);

  const typeOptions: { label: string; value: MediaType | undefined }[] = [
    { label: 'All', value: undefined },
    { label: 'Images', value: MediaType.IMAGE },
    { label: 'Videos', value: MediaType.VIDEO },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex gap-1 bg-white border border-gray-200 rounded-md p-1">
        {typeOptions.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onTypeChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded cursor-pointer transition-colors ${
              type === opt.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search media..."
        className="border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex-1 sm:max-w-xs"
      />
    </div>
  );
}
