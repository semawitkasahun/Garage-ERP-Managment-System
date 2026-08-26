import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTechnicians, useTransferEquipment } from '@/features/inventory/hooks/useEquipment';

export function TransferEquipmentModal({ open, onClose, checkoutRow }) {
  const { data: techniciansData } = useTechnicians();
  const transfer = useTransferEquipment();
  // techniciansData is now an array directly from the updated endpoint
  const technicians = (techniciansData ?? []).filter((technician) => technician.employee_id !== checkoutRow?.technician_id);
  const [newTechnicianId, setNewTechnicianId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  if (!open || !checkoutRow) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (!newTechnicianId || !reason.trim()) {
      setError('Select the new technician and give a reason.');
      return;
    }
    try {
      await transfer.mutateAsync({
        equipment_id: checkoutRow.equipment_id,
        from_technician_id: checkoutRow.technician_id,
        to_technician_id: newTechnicianId,
        reason,
      });
      toast.success('Equipment transferred');
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Transfer failed.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-tight">Transfer equipment</h2><button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <p className="mb-4 text-sm text-muted-foreground">{checkoutRow.equipment_name} - currently with {checkoutRow.technician_name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label className="text-xs">New technician</Label><select value={newTechnicianId} onChange={(event) => setNewTechnicianId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select...</option>{technicians.map((technician) => <option key={technician.employee_id} value={technician.employee_id}>{technician.name}</option>)}</select></div>
          <div><Label className="text-xs">Reason</Label><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={transfer.isPending}>{transfer.isPending ? 'Transferring...' : 'Confirm transfer'}</Button>
        </form>
      </div>
    </div>
  );
}