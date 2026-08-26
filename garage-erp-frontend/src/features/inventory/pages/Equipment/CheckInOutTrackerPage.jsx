import { useState } from 'react';
import { useCheckoutLog } from '@/hooks/useEquipment';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getNavSections } from '@/layouts/navSections';
import CheckoutSessionModal from './components/CheckoutSessionModal';
import ReturnSessionModal from './components/ReturnSessionModal';

const STATUS_STYLES = {
  'Checked Out': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Returned: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export function CheckInOutTrackerPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);
  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const { data, isLoading } = useCheckoutLog(filters);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <DashboardLayout navSections={navSections} pageTitle="Check-Out / In Tracker" roleLabel={user?.username ?? 'Staff'}>
      <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Check-Out / Check-In Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every equipment hand-off, in one place — who has what, since when, and whether it's back.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowReturn(true)}
            className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Return Equipment
          </button>
          <button
            onClick={() => setShowCheckout(true)}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Check Out Equipment
          </button>
        </div>
      </div>

      <div className="mb-4 flex gap-2 border-b border-slate-200 pb-4">
        {['', 'open', 'overdue', 'returned'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilters((f) => ({ ...f, status: s, page: 1 }))}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filters.status === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === '' ? 'All' : s === 'open' ? 'Checked Out' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-400">
              <th className="py-3 pr-4">Technician</th>
              <th className="py-3 pr-4">Equipment</th>
              <th className="py-3 pr-4">Job Card</th>
              <th className="py-3 pr-4">Checked Out</th>
              <th className="py-3 pr-4">Due</th>
              <th className="py-3 pr-4">Returned</th>
              <th className="py-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="py-16 text-center text-sm text-slate-400">No checkout activity matches this filter.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className={r.status === 'Overdue' ? 'bg-rose-50/40' : ''}>
                  <td className="py-3 pr-4 font-medium text-slate-900">{r.technician ?? '—'}</td>
                  <td className="py-3 pr-4">
                    <div>{r.equipment.name}</div>
                    <div className="font-mono text-xs text-slate-400">{r.equipment.code}</div>
                  </td>
                  <td className="py-3 pr-4 text-slate-600">{r.job_card_id ?? '—'}</td>
                  <td className="py-3 pr-4 text-slate-600">{r.checked_out_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-3 pr-4 text-slate-600">{r.due_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-3 pr-4 text-slate-600">{r.returned_at ? r.returned_at.slice(0, 16).replace('T', ' ') : '—'}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>Page {meta.current_page} of {meta.last_page}</span>
          <div className="flex gap-2">
            <button
              disabled={meta.current_page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={meta.current_page >= meta.last_page}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="rounded-lg border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showCheckout && <CheckoutSessionModal onClose={() => setShowCheckout(false)} />}
      {showReturn && <ReturnSessionModal onClose={() => setShowReturn(false)} />}
      </div>
    </DashboardLayout>
  );
}

export default CheckInOutTrackerPage;

