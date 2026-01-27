import { useState, useCallback, useRef } from 'react';
import type { ToastMessage } from '../components/Toast';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'error', data?: unknown) => {
    setToasts((prev) => [...prev, { id: Date.now() + idRef.current++, text, type, data }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
