import { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  text: string;
  data: unknown;
  type: 'error' | 'success';
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const isError = toast.type === 'error';

  return (
    <div
      className={`min-w-[280px] max-w-md px-4 py-3 rounded-lg shadow-lg text-sm font-medium animate-[slideIn_0.2s_ease-out] ${
        isError
          ? 'bg-red-600 text-white'
          : 'bg-green-600 text-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{toast.text}</span>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-white/80 hover:text-white cursor-pointer shrink-0"
        >
          &times;
        </button>
      </div>
      {toast.data != null && typeof toast.data === 'object' && (
        <pre className="mt-2 text-xs bg-black/20 rounded p-2 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(toast.data, null, 2)}
        </pre>
      )}
    </div>
  );
}
