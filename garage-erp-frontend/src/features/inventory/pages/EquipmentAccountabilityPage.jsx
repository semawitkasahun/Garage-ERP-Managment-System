import { useState } from 'react';
import { AlertTriangle, LayoutGrid, Package } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAccountability, useTechnicians } from '@/features/inventory/hooks/useEquipment';
import { ExtendReturnModal } from '@/features/inventory/components/ExtendReturnModal';
import { ReportMissingModal } from '@/features/inventory/components/ReportMissingModal';
import { TransferEquipmentModal } from '@/features/inventory/components/TransferEquipmentModal';

const SUMMARY = [
  { key: 'checked_out', label: 'Checked Out' },
  { key: 'returned_today', label: 'Returned Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'missing', label: 'Missing' },
  { key: 'maintenance', label: 'Maintenance' },
];

export function EquipmentAccountabilityPage() {
  const { user } = useAuthStore();
  const [technician, setTechnician] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState(null);
  const { data, isLoading } = useAccountability({ technician_id: technician, status });
  const { data: techniciansData } = useTechnicians();
  const technicians = techniciansData?.data ?? [];
  const rows = data?.data ?? [];
  const summary = data?.summary ?? {};

  const navSections = [
    { label: 'Overview', items: [{ label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' }] },
    { label: 'Inventory & Supply', items: [
      { label: 'Inventory Dashboard', icon: LayoutGrid, path: '/inventory' },
      { label: 'Parts & Stock', icon: Package, path: '/inventory/parts' },
      { label: 'Equipment Accountability', icon: LayoutGrid, path: '/equipment/accountability' },
    ] },
  ];

  function isOverdue(row) {
    return String(row.status).toLowerCase() === 'checked_out' && row.expected_return_at && new Date(row.expected_return_at) < new Date();
  }

  return (
    <DashboardLayout navSections={navSections} pageTitle="Equipment Accountability" roleLabel={user?.username ?? 'Staff'}>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {SUMMARY.map((item) => <div key={item.key} className="rounded-lg border border-border bg-card p-4"><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{item.label}</p><p className="font-display text-2xl font-semibold tracking-tight">{isLoading ? '—' : (summary[item.key] ?? 0)}</p></div>)}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <select value={technician} onChange={(event) => setTechnician(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">All technicians</option>{technicians.map((item) => <option key={item.employee_id ?? item.id} value={item.employee_id ?? item.id}>{item.first_name ? `${item.first_name} ${item.last_name}` : item.name}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">All statuses</option><option value="checked_out">Checked Out</option><option value="overdue">Overdue</option><option value="missing">Missing</option><option value="maintenance">Maintenance</option></select>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm"><thead><tr className="border-b border-border text-left">{['Equipment', 'Equipment ID', 'Technician', 'Work Order', 'Job Card', 'Checkout', 'Expected Return', 'Status', 'Actions'].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{heading}</th>)}</tr></thead><tbody>
          {isLoading ? <tr><td colSpan={9} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr> : rows.length === 0 ? <tr><td colSpan={9} className="px-4 py-6 text-center italic text-muted-foreground">No equipment currently tracked under these filters.</td></tr> : rows.map((row) => { const overdue = isOverdue(row); return <tr key={row.checkout_id} className="border-b border-border last:border-0" style={overdue ? { background: 'hsl(0 40% 97%)' } : undefined}><td className="px-3 py-2.5 font-medium">{row.equipment_name}</td><td className="px-3 py-2.5 font-mono text-xs">{row.equipment_id}</td><td className="px-3 py-2.5">{row.technician_name}</td><td className="px-3 py-2.5 text-muted-foreground">{row.work_order_id ?? '—'}</td><td className="px-3 py-2.5 text-muted-foreground">{row.job_card_id ?? '—'}</td><td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">{row.checkout_at ? new Date(row.checkout_at).toLocaleString() : '—'}</td><td className="whitespace-nowrap px-3 py-2.5">{overdue ? <span className="flex items-center gap-1 font-medium text-destructive"><AlertTriangle className="h-3.5 w-3.5" />{new Date(row.expected_return_at).toLocaleString()}</span> : (row.expected_return_at ? new Date(row.expected_return_at).toLocaleString() : '—')}</td><td className="px-3 py-2.5"><span className="rounded px-2 py-0.5 text-xs font-medium" style={overdue ? { background: 'hsl(0 40% 92%)', color: 'hsl(0 50% 40%)' } : { background: 'hsl(84 20% 89%)', color: 'hsl(84 25% 25%)' }}>{overdue ? 'Overdue' : String(row.status ?? 'Checked Out').replace('_', ' ')}</span></td><td className="px-3 py-2.5"><div className="flex flex-wrap gap-2 whitespace-nowrap"><button type="button" onClick={() => setModal({ type: 'extend', row })} className="text-xs underline" style={{ color: 'hsl(84 30% 32%)' }}>Extend</button><button type="button" onClick={() => setModal({ type: 'transfer', row })} className="text-xs text-muted-foreground underline">Transfer</button><button type="button" onClick={() => setModal({ type: 'missing', row })} className="text-xs text-destructive underline">Report Missing</button></div></td></tr>; })}
        </tbody></table>
      </div>
      <TransferEquipmentModal open={modal?.type === 'transfer'} checkoutRow={modal?.row} onClose={() => setModal(null)} />
      <ExtendReturnModal open={modal?.type === 'extend'} checkoutRow={modal?.row} onClose={() => setModal(null)} />
      <ReportMissingModal open={modal?.type === 'missing'} checkoutRow={modal?.row} onClose={() => setModal(null)} />
    </DashboardLayout>
  );
}