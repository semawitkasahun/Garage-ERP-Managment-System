import { useState } from 'react';
import { LayoutGrid, Package, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useSuppliersList } from '@/features/inventory/hooks/useSuppliersPage';
import { AddSupplierModal } from '@/features/inventory/components/AddSupplierModal';

export function SuppliersPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useSuppliersList({ search });
  const suppliers = data?.data ?? [];
  const navSections = [
    { label: 'Overview', items: [{ label: 'Dashboard', icon: LayoutGrid, path: '/dashboard' }] },
    { label: 'Inventory & Supply', items: [
      { label: 'Inventory Dashboard', icon: LayoutGrid, path: '/inventory' },
      { label: 'Parts & Stock', icon: Package, path: '/inventory/parts' },
      { label: 'Suppliers', icon: LayoutGrid, path: '/inventory/suppliers' },
    ] },
  ];

  return (
    <DashboardLayout navSections={navSections} pageTitle="Suppliers" roleLabel={user?.username ?? 'Staff'}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-64"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input type="text" placeholder="Search suppliers..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none" /></div>
        <button type="button" onClick={() => setModalOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: 'hsl(84 25% 30%)' }}><Plus className="h-4 w-4" />Add supplier</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm"><thead><tr className="border-b border-border text-left">{['Name', 'Contact', 'Phone', 'Email', 'Items Supplied', 'Total Purchases', 'Status'].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-2.5 font-mono text-[10px] font-medium uppercase tracking-widest text-muted-foreground">{heading}</th>)}</tr></thead><tbody>
          {isLoading ? <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Loading...</td></tr> : suppliers.length === 0 ? <tr><td colSpan={7} className="px-4 py-6 text-center italic text-muted-foreground">No suppliers yet.</td></tr> : suppliers.map((supplier) => <tr key={supplier.supplier_id ?? supplier.id} className="border-b border-border last:border-0"><td className="px-3 py-2.5 font-medium">{supplier.name}</td><td className="px-3 py-2.5 text-muted-foreground">{supplier.contact_person ?? '—'}</td><td className="px-3 py-2.5 text-muted-foreground">{supplier.phone ?? '—'}</td><td className="px-3 py-2.5 text-muted-foreground">{supplier.email ?? '—'}</td><td className="px-3 py-2.5 text-muted-foreground">{supplier.items_supplied_count ?? 0}</td><td className="px-3 py-2.5 text-muted-foreground">ETB {(supplier.total_purchases ?? 0).toLocaleString()}</td><td className="px-3 py-2.5"><span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 25% 25%)' }}>{supplier.status ?? 'Active'}</span></td></tr>)}
        </tbody></table>
      </div>
      <AddSupplierModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  );
}