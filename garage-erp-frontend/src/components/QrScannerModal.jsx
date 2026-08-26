import { useState, useEffect, useRef } from 'react';
import { X, Camera, ScanLine } from 'lucide-react';

/**
 * Professional QR Code Scanner Modal
 * 
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onDetected: (token: string) => void
 * - title: string (default: "Scan QR Code")
 * - hint: string (default: "Point camera at QR code")
 * - loading: boolean
 */
export default function QrScannerModal({
  open,
  onClose,
  onDetected,
  title = 'Scan QR Code',
  hint = 'Point camera at QR code',
  loading = false,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (err) {
      setError('Camera access denied or unavailable');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      onDetected(e.target.value.trim());
      e.target.value = '';
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{hint}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scanner Content */}
        <div className="space-y-4 px-6 py-5">
          {error && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Camera View */}
          <div className="relative aspect-video rounded-lg bg-slate-900 overflow-hidden">
            {!isScanning ? (
              <div className="flex h-full flex-col items-center justify-center text-slate-400">
                <Camera className="h-12 w-12 mb-2" />
                <p className="text-sm">Camera not active</p>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
                {/* Scan Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <div className="absolute inset-0 border-2 border-sky-500 rounded-lg" />
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-sky-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-sky-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-sky-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-sky-400 rounded-br-lg" />
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-sky-400/50 animate-pulse" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Or enter QR code manually
            </label>
            <input
              type="text"
              placeholder="Enter QR code or equipment ID"
              onKeyDown={handleManualInput}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (isScanning) {
                  // Simulate QR detection for demo
                  // In production, this would use a QR library like html5-qrcode
                  onDetected('DEMO-QR-CODE');
                } else {
                  startCamera();
                }
              }}
              disabled={loading}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isScanning ? 'Simulate Scan' : 'Start Camera'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
