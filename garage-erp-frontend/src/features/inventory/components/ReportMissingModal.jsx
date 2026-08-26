import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useReportMissing } from '@/features/inventory/hooks/useEquipment';

export function ReportMissingModal({ open, onClose, checkoutRow }) {
  const reportMissing = useReportMissing();
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  if (!open || !checkoutRow) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (!notes.trim()) {
      setError('A note is required when reporting missing equipment.');
      return;
    }
    try {
      await reportMissing.mutateAsync({ equipment_id: checkoutRow.equipment_id, checkout_id: checkoutRow.checkout_id, notes, photos });
      toast.success('Equipment reported missing');
      setNotes('');
      setPhotos([]);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not report equipment as missing.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-tight">Report missing equipment</h2><button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <p className="mb-4 text-sm text-muted-foreground">{checkoutRow.equipment_name} - currently with {checkoutRow.technician_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label className="text-xs">Details (required)</Label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Describe when and where the item was last seen..." /></div>
          <div><Label className="text-xs">Photos (optional)</Label><input type="file" accept="image/*" multiple onChange={(event) => setPhotos(Array.from(event.target.files ?? []))} className="w-full text-sm" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(0 45% 42%)' }} disabled={reportMissing.isPending}>{reportMissing.isPending ? 'Reporting...' : 'Report missing'}</Button>
        </form>
      </div>
    </div>
  );
}