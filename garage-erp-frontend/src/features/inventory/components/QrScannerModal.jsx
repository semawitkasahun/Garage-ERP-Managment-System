import { useEffect, useRef, useState } from 'react';
import { Check, ScanLine, X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export function QrScannerModal({ open, onClose, onScan, title = 'Scan equipment QR', continuous = false, scannedItems = [] }) {
  const containerId = 'qr-scanner-region';
  const scannerRef = useRef(null);
  const onScanRef = useRef(onScan);
  const lastCodeRef = useRef(null);
  const lastTimeRef = useRef(0);
  const flashTimeoutRef = useRef(null);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(true);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!open) return undefined;

    lastCodeRef.current = null;
    lastTimeRef.current = 0;
    const resetTimer = setTimeout(() => {
      setError(null);
      setStarting(true);
      setFlash(null);
    }, 0);
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        const now = Date.now();
        if (decodedText === lastCodeRef.current && now - lastTimeRef.current < 2000) return;
        lastCodeRef.current = decodedText;
        lastTimeRef.current = now;
        onScanRef.current(decodedText, {
          showFlash: (label) => {
            setFlash(label);
            if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
            flashTimeoutRef.current = setTimeout(() => setFlash(null), 1200);
          },
        });
      },
      () => {},
    ).then(() => {
      setStarting(false);
    }).catch((startError) => {
      setStarting(false);
      setError('Could not access camera. Check browser permissions and try again.');
      console.error(startError);
    });

    return () => {
      scannerRef.current = null;
      clearTimeout(resetTimer);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      scanner.stop().catch(() => {}).finally(() => scanner.clear());
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold"><ScanLine className="h-4 w-4" />{title}</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="relative w-full overflow-hidden rounded-md bg-black" style={{ minHeight: 260 }}>
          <div id={containerId} className="h-full w-full" />
          {flash && <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-black/70 px-3 py-2 text-sm font-medium text-white"><Check className="h-4 w-4" style={{ color: 'hsl(84 45% 55%)' }} />Added: {flash}</div>}
        </div>
        {starting && <p className="mt-3 text-center text-sm text-muted-foreground">Starting camera...</p>}
        {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
        {continuous ? <>
          <div className="mt-3">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Scanned this session ({scannedItems.length})</p>
            {scannedItems.length === 0 ? <p className="text-xs italic text-muted-foreground">Point the camera at each item's QR code - it will be added automatically.</p> : <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">{scannedItems.map((item) => <span key={item.equipment_id ?? item.id} className="rounded px-2 py-1 text-xs font-medium" style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 25% 25%)' }}>{item.name}</span>)}</div>}
          </div>
          <button type="button" onClick={onClose} className="mt-4 w-full rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: 'hsl(84 25% 30%)' }}>Done scanning ({scannedItems.length} item{scannedItems.length === 1 ? '' : 's'})</button>
        </> : <p className="mt-3 text-center text-xs text-muted-foreground">Point the camera at the equipment QR code.</p>}
      </div>
    </div>
  );
}