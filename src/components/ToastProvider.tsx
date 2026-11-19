import {createContext, useCallback, useContext, useState, type ReactNode} from 'react';
import {AlertCircle, CheckCircle2} from 'lucide-react';

interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), {id, type, message}]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const success = useCallback((message: string) => pushToast('success', message), [pushToast]);
  const error = useCallback((message: string) => pushToast('error', message), [pushToast]);

  return (
    <ToastContext.Provider value={{success, error}}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            dir="rtl"
            className={`animate-rise flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl ${
              toast.type === 'success'
                ? 'border-primary/40 bg-card/95 text-foreground'
                : 'border-destructive/60 bg-card/95 text-destructive'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
            ) : (
              <AlertCircle className="size-4 shrink-0 text-destructive" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
