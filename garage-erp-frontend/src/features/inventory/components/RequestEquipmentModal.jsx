import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEquipmentList, useRequestEquipment } from '@/features/inventory/hooks/useEquipment';

export function RequestEquipmentModal({ open, onClose }) {
  const { data: equipmentData } = useEquipmentList({ status: 'available' });
  const requestEquipment = useRequestEquipment();
  const equipment = equipmentData?.data ?? [];
  const [equipmentId, setEquipmentId] = useState('');
  const [jobCardId, setJobCardId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (!equipmentId || !jobCardId) {
      setError('Select equipment and enter your Job Card.');
      return;
    }
    try {
      await requestEquipment.mutateAsync({ equipment_id: equipmentId, job_card_id: jobCardId, reason });
      toast.success('Request sent to your supervisor');
      setEquipmentId('');
      setJobCardId('');
      setReason('');
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not submit request.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-tight">Request equipment</h2><button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label className="text-xs">Equipment</Label><select value={equipmentId} onChange={(event) => setEquipmentId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select...</option>{equipment.map((item) => <option key={item.equipment_id ?? item.id} value={item.equipment_id ?? item.id}>{item.name}</option>)}</select></div>
          <div><Label className="text-xs">Job Card</Label><Input value={jobCardId} onChange={(event) => setJobCardId(event.target.value)} placeholder="e.g. JC-00012" required /></div>
          <div><Label className="text-xs">Reason (optional)</Label><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={requestEquipment.isPending}>{requestEquipment.isPending ? 'Sending...' : 'Send request'}</Button>
        </form>
      </div>
    </div>
  );
}