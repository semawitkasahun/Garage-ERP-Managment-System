import { useMemo, useState } from 'react';
import { useEquipmentList } from '../hooks/useEquipment';
import { useQrImage } from '@/hooks/useEquipment';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getNavSections } from '@/layouts/navSections';
import { RotateCw, AlertTriangle } from 'lucide-react';

function QrImageDisplay({ equipmentId, type, alt, className }) {
  const { objectUrl, isLoading, error } = useQrImage(equipmentId, type);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
        <RotateCw className="h-4 w-4 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !objectUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-red-50 text-[9px] text-red-500 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-red-400" />
        <span>Failed</span>
      </div>
    );
  }
  return <img src={objectUrl} alt={alt} className={className} />;
}

export function EquipmentQrLabelsPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(() => new Set());

  const { data, isLoading } = useEquipmentList({ search, per_page: 100 });
  const items = useMemo(() => data?.data ?? [], [data]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((i) => i.id))));
  };

  const selectedItems = items.filter((i) => selected.has(i.id));

  return (
    <DashboardLayout navSections={navSections} pageTitle="Equipment QR Labels" roleLabel={user?.username ?? 'Staff'}>
      <div className="mx-auto max-w-5xl px-6 py-8">
      {/* Screen-only controls */}
      <div className="print:hidden">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Equipment QR Labels</h1>
            <p className="mt-1 text-sm text-slate-500">
              Print physical tags — each item gets a Tracking QR (safe to scan any time) and a Checkout QR
              (used only during check-out/check-in).
            </p>
          </div>
          <button
            disabled={selectedItems.length === 0}
            onClick={() => window.print()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-40"
          >
            Print {selectedItems.length > 0 ? `${selectedItems.length} Label(s)` : 'Labels'}
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment…"
            className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
          <button onClick={toggleAll} className="text-sm font-medium text-sky-700 hover:underline">
            {selected.size === items.length && items.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading equipment…</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {items.map((eq) => (
              <li key={eq.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={selected.has(eq.id)}
                  onChange={() => toggle(eq.id)}
                  className="rounded border-slate-300"
                />
                <span className="font-mono text-xs text-slate-400">{eq.equipment_code}</span>
                <span className="font-medium text-slate-900">{eq.name}</span>
                <span className="text-slate-400">{eq.category}</span>
              </li>
            ))}
            {items.length === 0 && !isLoading && (
              <li className="px-4 py-8 text-center text-sm text-slate-400">No equipment found.</li>
            )}
          </ul>
        )}
      </div>

      {/* Print-only label sheet */}
      <div className="hidden print:grid print:grid-cols-2 print:gap-4">
        {selectedItems.map((eq) => (
          <div key={eq.id} className="break-inside-avoid rounded-lg border border-slate-300 p-3">
            <p className="text-sm font-semibold text-slate-900">{eq.name}</p>
            <p className="font-mono text-xs text-slate-500">{eq.equipment_code}</p>
            <div className="mt-2 flex justify-around">
              <div className="text-center">
                <QrImageDisplay
                  equipmentId={eq.id}
                  type="tracking"
                  alt="Tracking QR"
                  className="mx-auto h-24 w-24 object-contain"
                />
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Track</p>
              </div>
              <div className="text-center">
                <QrImageDisplay
                  equipmentId={eq.id}
                  type="checkout"
                  alt="Checkout QR"
                  className="mx-auto h-24 w-24 object-contain"
                />
                <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">Check-Out</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </DashboardLayout>
  );
}

export default EquipmentQrLabelsPage;

