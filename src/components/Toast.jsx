import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // { id, message }
  const timerRef = useRef(null);

  const show = useCallback((message, opts = {}) => {
    const durationMs = opts.durationMs ?? 2400;
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    setToast({ id, message });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 bottom-6 z-[20000] flex justify-center px-4 pointer-events-none">
        {toast && (
          <div className="pointer-events-none rounded-full bg-brand-text/95 text-brand-bg text-sm px-4 py-2 shadow-xl border border-white/10 backdrop-blur">
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

