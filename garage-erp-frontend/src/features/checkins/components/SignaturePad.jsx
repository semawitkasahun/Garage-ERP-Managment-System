import { useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'hsl(90 15% 15%)';
  }, []);

  // Scales click/touch position to the canvas's internal coordinate space,
  // so drawing stays accurate regardless of how CSS resizes it on screen.
  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: (point.clientX - rect.left) * (canvas.width / rect.width),
      y: (point.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function start(e) {
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function move(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }

  function end() {
    if (!isDrawing) return;
    setIsDrawing(false);
    onChange(canvasRef.current.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  }

  return (
    <div>
      <div className="rounded-md border border-input bg-background">
        <canvas
          ref={canvasRef}
          width={500}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{hasSignature ? 'Signed' : 'Sign above'}</p>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3 w-3" /> Clear
        </button>
      </div>
    </div>
  );
}
