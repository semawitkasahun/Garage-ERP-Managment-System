import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
  success: { icon: CheckCircle, bg: 'hsl(145 35% 93%)', border: 'hsl(145 45% 70%)', text: 'hsl(145 45% 25%)', iconColor: 'hsl(145 55% 35%)' },
  error: { icon: AlertCircle, bg: 'hsl(0 45% 95%)', border: 'hsl(0 45% 70%)', text: 'hsl(0 45% 25%)', iconColor: 'hsl(0 55% 45%)' },
  warning: { icon: AlertTriangle, bg: 'hsl(42 55% 92%)', border: 'hsl(42 55% 65%)', text: 'hsl(42 55% 25%)', iconColor: 'hsl(42 65% 40%)' },
  info: { icon: Info, bg: 'hsl(200 45% 94%)', border: 'hsl(200 45% 70%)', text: 'hsl(200 45% 25%)', iconColor: 'hsl(200 55% 40%)' },
};

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);
  const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      style={{
        background: config.bg,
        borderLeft: `4px solid ${config.border}`,
        color: config.text,
        transform: isExiting ? 'translateX(120%)' : 'translateX(0)',
        opacity: isExiting ? 0 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
      }}
      className="flex items-start gap-3 px-4 py-3 rounded-lg min-w-[340px] max-w-[440px] pointer-events-auto"
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: config.iconColor }} />
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-semibold text-sm mb-0.5">{toast.title}</p>}
        <p className="text-sm leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Container */}
      <div
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback if used outside provider
    return {
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      warning: (msg) => console.warn('[Toast Warning]', msg),
      info: (msg) => console.info('[Toast Info]', msg),
    };
  }
  return context;
}
