import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Professional confirmation dialog to replace browser confirm()
 * 
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onConfirm: () => void
 * - title: string
 * - message: string | ReactNode
 * - confirmText: string (default: "Confirm")
 * - cancelText: string (default: "Cancel")
 * - confirmStyle: 'primary' | 'danger' (default: 'primary')
 * - loading: boolean
 * - icon: ReactNode (optional)
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'primary',
  loading = false,
  icon,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open && !loading) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose, loading]);

  if (!open) return null;

  const confirmBg = confirmStyle === 'danger'
    ? 'hsl(0 55% 45%)'
    : 'hsl(84 25% 30%)';

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--card, #fff)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)',
          maxWidth: '440px',
          width: '90%',
          animation: 'slideUp 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-0">
          <div className="flex items-center gap-3">
            {icon || (
              <div
                className="p-2 rounded-lg"
                style={{
                  background: confirmStyle === 'danger' ? 'hsl(0 45% 95%)' : 'hsl(84 20% 89%)',
                }}
              >
                <AlertTriangle
                  className="h-5 w-5"
                  style={{
                    color: confirmStyle === 'danger' ? 'hsl(0 55% 45%)' : 'hsl(84 25% 30%)',
                  }}
                />
              </div>
            )}
            <h3 className="font-display text-lg font-semibold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-md hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
            style={{ background: confirmBg }}
          >
            {loading && (
              <span
                className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                style={{ animation: 'spin 0.6s linear infinite' }}
              />
            )}
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
