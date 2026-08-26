import { useState } from 'react';
import { LayoutGrid, Package, ScanLine, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { equipmentApi } from '@/features/inventory/api/equipmentApi';
import { useCheckoutEquipment, useTechnicians } from '@/features/inventory/hooks/useEquipment';
import { QrScannerModal } from '@/features/inventory/components/QrScannerModal';

export function EquipmentCheckoutPage() {
  const { user } = useAuthStore();
  const { data: techniciansData } = useTechnicians();
  const checkout = useCheckoutEquipment();
  const technicians = techniciansData?.data ?? [];
  const [technicianId, setTechnicianId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [jobCardId, setJobCardId] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');
  const [scanned, setScanned] = useState([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState(null);

  const navSections = [
    { label: 'Overview', items: [{ label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' }] },
    { label: 'Inventory & Supply', items: [
      { label: 'Inventory Dashboard', icon: LayoutGrid, path: '/inventory' },
      { label: 'Parts & Stock', icon: Package, path: '/inventory/parts' },
      { label: 'Equipment Accountability', icon: LayoutGrid, path: '/equipment/accountability' },
    ] },
  ];

  const technicianName = technicians.find((technician) => String(technician.employee_id ?? technician.id) === String(technicianId));
  const readyToScan = technicianId && workOrderId && jobCardId;

  async function handleScan(code, { showFlash } = {}) {
    setScanError(null);
    try {
      const equipment = await equipmentApi.lookupByQr(code);
      const equipmentId = equipment.equipment_id ?? equipment.id;
      const status = String(equipment.status ?? '').toLowerCase();
      if (scanned.some((item) => (item.equipment_id ?? item.id) === equipmentId)) {
        setScanError(`${equipment.name} is already in this technician's list.`);
        return;
      }
      if (status !== 'available') {
        setScanError(`${equipment.name} is not available (status: ${equipment.status}).`);
        return;
      }
      showFlash?.(equipment.name);
      setScanned((previous) => [...previous, { ...equipment, equipment_id: equipmentId }]);
    } catch (requestError) {
      setScanError(requestError.response?.data?.message ?? 'Equipment not found for this QR code.');
    }
  }

  async function handleConfirm() {
    if (!technicianId || !workOrderId || !jobCardId || scanned.length === 0) {
      toast.error('Select a technician, work order, job card, and scan at least one item.');
      return;
    }
    try {
      await checkout.mutateAsync({
        technician_id: technicianId,
        work_order_id: workOrderId,
        job_card_id: jobCardId,
        expected_return_at: expectedReturn || undefined,
        equipment_ids: scanned.map((item) => item.equipment_id ?? item.id),
      });
      toast.success(`${scanned.length} item(s) checked out to ${technicianName?.first_name ?? 'technician'}.`);
      setScanned([]);
      setTechnicianId('');
      setWorkOrderId('');
      setJobCardId('');
      setExpectedReturn('');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message ?? 'Checkout failed.');
    }
  }

  return (
    <DashboardLayout navSections={navSections} pageTitle="Assign / Checkout Equipment" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-2xl space-y-5">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-sm font-semibold tracking-tight">1. Who is this for?</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Technician</Label><select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select...</option>{technicians.map((technician) => <option key={technician.employee_id ?? technician.id} value={technician.employee_id ?? technician.id}>{technician.first_name ? `${technician.first_name} ${technician.last_name}` : technician.name}</option>)}</select></div>
            <div><Label className="text-xs">Expected return</Label><Input type="datetime-local" value={expectedReturn} onChange={(event) => setExpectedReturn(event.target.value)} /></div>
            <div><Label className="text-xs">Work Order</Label><Input value={workOrderId} onChange={(event) => setWorkOrderId(event.target.value)} placeholder="e.g. WO-00010" /></div>
            <div><Label className="text-xs">Job Card</Label><Input value={jobCardId} onChange={(event) => setJobCardId(event.target.value)} placeholder="e.g. JC-00010" /></div>
          </div>
          {!readyToScan && <p className="mt-3 text-xs text-muted-foreground">Fill in technician, work order, and job card to unlock scanning.</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-display text-sm font-semibold tracking-tight">2. Scan equipment</h2>{technicianName && <p className="mt-0.5 text-xs text-muted-foreground">Building {technicianName.first_name}'s equipment pile - scan as many items as needed.</p>}</div><button type="button" onClick={() => setScannerOpen(true)} disabled={!readyToScan} className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-50" style={{ background: 'hsl(84 25% 30%)' }}><ScanLine className="h-4 w-4" />{scanned.length > 0 ? 'Scan more' : 'Start scanning'}</button></div>
          {scanError && <p className="mb-3 text-sm text-destructive">{scanError}</p>}
          {scanned.length === 0 ? <p className="text-sm italic text-muted-foreground">No equipment scanned yet.</p> : <div className="space-y-2">{scanned.map((item) => <div key={item.equipment_id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"><div><p className="font-medium">{item.name} <span className="font-normal text-muted-foreground">({item.equipment_id})</span></p><p className="text-xs text-muted-foreground">{item.condition ?? 'Good'} · {item.location?.name ?? item.current_location ?? 'Unknown location'}</p></div><button type="button" onClick={() => setScanned((previous) => previous.filter((scannedItem) => scannedItem.equipment_id !== item.equipment_id))} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
        </div>
        <Button onClick={handleConfirm} className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={checkout.isPending || scanned.length === 0}>{checkout.isPending ? 'Confirming...' : `Confirm Checkout - ${scanned.length} item${scanned.length === 1 ? '' : 's'} to ${technicianName?.first_name ?? '...'}`}</Button>
      </div>
      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} continuous scannedItems={scanned} title={`Scanning for ${technicianName?.first_name ?? 'technician'}`} />
    </DashboardLayout>
  );
}