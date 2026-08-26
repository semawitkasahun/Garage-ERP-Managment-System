import { useState } from 'react';
import { LayoutGrid, Package, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { equipmentApi } from '@/features/inventory/api/equipmentApi';
import { useReturnEquipment } from '@/features/inventory/hooks/useEquipment';
import { QrScannerModal } from '@/features/inventory/components/QrScannerModal';

const CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'missing_parts', label: 'Missing Parts' },
  { value: 'needs_maintenance', label: 'Needs Maintenance' },
];

export function EquipmentReturnPage() {
  const { user } = useAuthStore();
  const returnEquipment = useReturnEquipment();
  const [scannerOpen, setScannerOpen] = useState(true);
  const [equipment, setEquipment] = useState(null);
  const [condition, setCondition] = useState('good');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  const navSections = [
    { label: 'Overview', items: [{ label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' }] },
    { label: 'Inventory & Supply', items: [
      { label: 'Inventory Dashboard', icon: LayoutGrid, path: '/inventory' },
      { label: 'Parts & Stock', icon: Package, path: '/inventory/parts' },
      { label: 'Equipment Accountability', icon: LayoutGrid, path: '/equipment/accountability' },
    ] },
  ];

  async function handleScan(code) {
    setError(null);
    try {
      const result = await equipmentApi.lookupByQr(code);
      const status = String(result.status ?? '').toLowerCase();
      if (status !== 'checked out') {
        setError(`${result.name} is not currently checked out (status: ${result.status}).`);
        return;
      }
      setEquipment({ ...result, equipment_id: result.equipment_id ?? result.id });
      setScannerOpen(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Equipment not found for this QR code.');
    }
  }

  const needsNote = condition !== 'good';

  async function handleConfirm() {
    if (!equipment) return;
    if (needsNote && !notes.trim()) {
      toast.error('A note is required for damaged, missing parts, or maintenance returns.');
      return;
    }
    try {
      await returnEquipment.mutateAsync({
        equipment_id: equipment.equipment_id,
        condition,
        notes,
        photos: needsNote ? photos : [],
      });
      const conditionLabel = CONDITIONS.find((item) => item.value === condition)?.label ?? condition;
      toast.success(`${equipment.name} returned - marked ${conditionLabel}`);
      setEquipment(null);
      setCondition('good');
      setNotes('');
      setPhotos([]);
      setScannerOpen(true);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message ?? 'Return failed.');
    }
  }

  return (
    <DashboardLayout navSections={navSections} pageTitle="Return Equipment" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-xl">
        {equipment === null ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">Scan the equipment QR code to begin the return.</p>
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <button type="button" onClick={() => setScannerOpen(true)} className="mx-auto flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: 'hsl(84 25% 30%)' }}><ScanLine className="h-4 w-4" />Scan QR</button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Equipment</h2>
              <p className="font-medium">{equipment.name} <span className="font-normal text-muted-foreground">({equipment.equipment_id})</span></p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <p>Technician: <span className="text-foreground">{equipment.current_checkout?.technician?.first_name ?? equipment.active_checkout?.employee?.name ?? '—'}</span></p>
                <p>Work Order: <span className="text-foreground">{equipment.current_checkout?.work_order_id ?? '—'}</span></p>
                <p>Job Card: <span className="text-foreground">{equipment.current_checkout?.job_card_id ?? '—'}</span></p>
                <p>Checked out: <span className="text-foreground">{equipment.current_checkout?.checkout_at ? new Date(equipment.current_checkout.checkout_at).toLocaleString() : '—'}</span></p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Condition on return</h2>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {CONDITIONS.map((item) => <button key={item.value} type="button" onClick={() => setCondition(item.value)} className="rounded-md border px-3 py-2 text-left text-sm font-medium" style={condition === item.value ? { borderColor: 'hsl(84 30% 40%)', background: 'hsl(84 20% 92%)', color: 'hsl(84 30% 25%)' } : { borderColor: 'hsl(45 15% 87%)' }}>{item.label}</button>)}
              </div>
              {needsNote && <><Label className="text-xs">Note (required)</Label><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mb-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Describe the issue..." /><Label className="text-xs">Photos (optional)</Label><input type="file" accept="image/*" multiple capture="environment" onChange={(event) => setPhotos(Array.from(event.target.files ?? []))} className="w-full text-sm" /></>}
            </div>
            <Button onClick={handleConfirm} className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={returnEquipment.isPending}>{returnEquipment.isPending ? 'Confirming...' : 'Confirm Return'}</Button>
          </div>
        )}
      </div>
      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} title="Scan equipment to return" />
    </DashboardLayout>
  );
}