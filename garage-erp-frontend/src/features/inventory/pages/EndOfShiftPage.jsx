import { useState } from 'react';
import { LayoutGrid, Package } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useEndOfShift } from '@/features/inventory/hooks/useEquipment';
import { ExtendReturnModal } from '@/features/inventory/components/ExtendReturnModal';
import { ReportMissingModal } from '@/features/inventory/components/ReportMissingModal';
import { TransferEquipmentModal } from '@/features/inventory/components/TransferEquipmentModal';

export function EndOfShiftPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useEndOfShift();
  const [modal, setModal] = useState(null);
  const rows = data?.data ?? [];
  const navSections = [
    { label: 'Overview', items: [{ label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' }] },
    { label: 'Inventory & Supply', items: [
      { label: 'Inventory Dashboard', icon: LayoutGrid, path: '/inventory' },
      { label: 'Parts & Stock', icon: Package, path: '/inventory/parts' },
      { label: 'Equipment Accountability', icon: LayoutGrid, path: '/equipment/accountability' },
      { label: 'End of Shift', icon: LayoutGrid, path: '/equipment/end-of-shift' },
    ] },
  ];

  return (
    <DashboardLayout navSections={navSections} pageTitle="End-of-Shift Equipment Accountability" roleLabel={user?.username ?? 'Staff'}>
      <p className="mb-5 text-sm text-muted-foreground">Everything still checked out as of now. Extend legitimately in-use equipment rather than forcing a return.</p>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm"><thead><tr className="border-b border-border text-left">{['Technician', 'Equipment', 'Equipment ID', 'Job Card', 'Checkout Time', 'Expected Return', 'Status', 'Actions'].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{heading}</th>)}</tr></thead><tbody>
          {isLoading ? <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan={8} className="px-4 py-6 text-center italic text-muted-foreground">Everything is checked in. Nothing outstanding.</td></tr> : rows.map((row) => <tr key={row.checkout_id} className="border-b border-border last:border-0"><td className="px-3 py-2.5 font-medium">{row.technician_name}</td><td className="px-3 py-2.5">{row.equipment_name}</td><td className="px-3 py-2.5 font-mono text-xs">{row.equipment_id}</td><td className="px-3 py-2.5 text-muted-foreground">{row.job_card_id ?? '—'}</td><td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{row.checkout_at ? new Date(row.checkout_at).toLocaleString() : '—'}</td><td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{row.expected_return_at ? new Date(row.expected_return_at).toLocaleString() : '—'}</td><td className="px-3 py-2.5"><span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 25% 25%)' }}>{String(row.status ?? 'checked_out').replace('_', ' ')}</span></td><td className="px-3 py-2.5"><div className="flex flex-wrap gap-2 whitespace-nowrap"><button type="button" onClick={() => setModal({ type: 'extend', row })} className="text-xs underline" style={{ color: 'hsl(84 30% 32%)' }}>Extend</button><button type="button" onClick={() => setModal({ type: 'transfer', row })} className="text-xs text-muted-foreground underline">Transfer</button><button type="button" onClick={() => setModal({ type: 'missing', row })} className="text-xs text-destructive underline">Report Missing</button></div></td></tr>)}
        </tbody></table>
      </div>
      <TransferEquipmentModal open={modal?.type === 'transfer'} checkoutRow={modal?.row} onClose={() => setModal(null)} />
      <ExtendReturnModal open={modal?.type === 'extend'} checkoutRow={modal?.row} onClose={() => setModal(null)} />
      <ReportMissingModal open={modal?.type === 'missing'} checkoutRow={modal?.row} onClose={() => setModal(null)} />
    </DashboardLayout>
  );
}