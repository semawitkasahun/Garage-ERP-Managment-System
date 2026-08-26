import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExtendReturn } from '@/features/inventory/hooks/useEquipment';

export function ExtendReturnModal({ open, onClose, checkoutRow }) {
  const extend = useExtendReturn();
  const [newReturnAt, setNewReturnAt] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  if (!open || !checkoutRow) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (!newReturnAt || !reason.trim()) {
      setError('New return time and reason are both required.');
      return;
    }
    try {
      await extend.mutateAsync({ checkoutId: checkoutRow.checkout_id, payload: { expected_return_at: newReturnAt, reason } });
      toast.success('Return time extended');
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not extend.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-tight">Extend return</h2><button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <p className="mb-4 text-sm text-muted-foreground">{checkoutRow.equipment_name} - {checkoutRow.technician_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label className="text-xs">New expected return</Label><Input type="datetime-local" value={newReturnAt} onChange={(event) => setNewReturnAt(event.target.value)} required /></div>
          <div><Label className="text-xs">Reason</Label><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={extend.isPending}>{extend.isPending ? 'Saving...' : 'Confirm extension'}</Button>
        </form>
      </div>
    </div>
  );
}