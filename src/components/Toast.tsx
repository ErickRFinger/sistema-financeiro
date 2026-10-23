import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

// Standalone event emitter for showToast() callable from anywhere
const listeners = new Set<(toast: Omit<ToastItem, 'id'>) => void>();

export const showToast = (message: string, type: ToastType = 'success', duration = 3000) => {
  listeners.forEach((fn) => fn({ message, type, duration }));
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { ...item, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen for external showToast() calls
  useEffect(() => {
    const handler = (item: Omit<ToastItem, 'id'>) => {
      addToast(item);
    };
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, [addToast]);

  const value: ToastContextType = { toasts, addToast, removeToast, showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const TYPE_CONFIG: Record<ToastType, { bg: string; border: string; text: string; progress: string }> = {
  success: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    progress: 'bg-emerald-400',
  },
  error: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    progress: 'bg-rose-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    progress: 'bg-amber-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    progress: 'bg-blue-400',
  },
};

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-rose-400" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-400" />;
    default:
      return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
  }
};

const ToastItemView: React.FC<{ toast: ToastItem; onRemove: (id: string) => void }> = ({
  toast,
  onRemove,
}) => {
  const config = TYPE_CONFIG[toast.type];
  const progressRef = useRef<HTMLDivElement>(null);
  const duration = toast.duration ?? 3000;

  useEffect(() => {
    // Inicia a barra de progresso regressiva
    if (progressRef.current) {
      // Pequeno delay para garantir que a transição CSS dispare
      const frame = requestAnimationFrame(() => {
        if (progressRef.current) {
          progressRef.current.style.transition = `width ${duration}ms linear`;
          progressRef.current.style.width = '0%';
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [duration]);

  useEffect(() => {
    // Auto-dismiss após a duração definida
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, onRemove]);

  return (
    <div
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl ${
        config.bg
      } ${config.border} animate-in slide-in-from-top-4 duration-200`}
    >
      <div className="flex-shrink-0">{getIcon(toast.type)}</div>
      <div className="flex-1 min-w-[200px] sm:min-w-[240px]">
        <p className={`text-sm font-medium ${config.text}`}>{toast.message}</p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        <button
          onClick={() => onRemove(toast.id)}
          className="p-1 rounded hover:bg-slate-800/50 transition-colors"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4 text-slate-500 hover:text-white" />
        </button>
      </div>
      <div className="absolute bottom-0 left-0 h-1 overflow-hidden rounded-full bg-slate-800/50 w-full">
        <div
          ref={progressRef}
          className={`h-full ${config.progress} transition-[width] duration-[3000] ease-linear w-full`}
        />
      </div>
    </div>
  );
};

const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id}>
          <ToastItemView toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

export default ToastProvider;