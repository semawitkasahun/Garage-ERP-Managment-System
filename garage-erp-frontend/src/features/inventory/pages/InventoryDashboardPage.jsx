import { useState } from 'react';
import { useInventoryDashboard } from '@/hooks/useInventory';
import { useApproveEquipmentRequest, useRejectEquipmentRequest } from '@/hooks/useEquipment';
import { useToast } from '@/components/Toast';
import SummaryCard from './components/SummaryCard';
import CheckoutSessionModal from './Equipment/components/CheckoutSessionModal';
import ReturnSessionModal from './Equipment/components/ReturnSessionModal';

export function InventoryDashboardPage() {
  const { data, isLoading, refetch, isFetching } = useInventoryDashboard();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReturn, setShowReturn] = useState(false);

  const approve = useApproveEquipmentRequest();
  const reject = useRejectEquipmentRequest();
  const toast = useToast();

  const cards = data?.cards ?? {};
  const stock = data?.stock_overview ?? {};
  const alerts = data?.alerts ?? {};
  const pendingRequests = data?.pending_requests ?? [];
  const accountability = data?.equipment_accountability ?? [];

  const handleApprove = (id) => {
    approve.mutate(
      { id, payload: {} },
      { onSuccess: () => toast.success('Request approved.'), onError: () => toast.error('Could not approve request.') }
    );
  };

  const handleReject = (id) => {
    const reason = window.prompt('Reason for rejecting this request?');
    if (!reason) return;
    reject.mutate(
      { id, payload: { review_notes: reason } },
      { onSuccess: () => toast.success('Request rejected.'), onError: () => toast.error('Could not reject request.') }
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Inventory & Equipment Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live overview of parts inventory, low stock alerts, and reusable tools/equipment accountability.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowCheckout(true)}
            className="rounded-lg border border-sky-600 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            Scan Equipment QR
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <SummaryCard label="Total Items" value={cards.total_items} />
        <SummaryCard label="Low Stock" value={cards.low_stock} tone="warn" />
        <SummaryCard label="Out of Stock" value={cards.out_of_stock} tone="danger" />
        <SummaryCard label="Equipment" value={cards.total_equipment} tone="info" />
        <SummaryCard label="Checked Out" value={cards.checked_out_equipment} tone="info" />
        <SummaryCard label="Overdue" value={cards.overdue_equipment} tone="danger" />
        <SummaryCard label="Pending Req." value={cards.pending_equipment_requests} />
        <SummaryCard label="Maintenance" value={cards.maintenance_equipment} tone="warn" />
      </div>

      {/* Quick actions */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Quick Inventory & Equipment Actions</p>
        <div className="flex flex-wrap gap-2">
          <QuickAction label="+ Add Item" primary />
          <QuickAction label="Receive Stock" />
          <QuickAction label="Issue Parts" />
          <QuickAction label="Assign Equipment" onClick={() => setShowCheckout(true)} />
          <QuickAction label="Return Equipment" onClick={() => setShowReturn(true)} />
          <QuickAction label="Scan Equipment QR" onClick={() => setShowCheckout(true)} />
          <QuickAction label="Print QR Labels" href="/equipment/qr-labels" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stock overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-slate-900">Stock Valuation & Movement</p>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Total Inventory Value</p>
            <p className="mt-1 font-mono text-2xl font-semibold text-emerald-800">
              ETB {Number(stock.total_inventory_value ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-400">Received This Month</p>
              <p className="font-mono text-lg font-semibold text-emerald-600">+{stock.received_this_month ?? 0} pcs</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-400">Issued This Month</p>
              <p className="font-mono text-lg font-semibold text-amber-600">-{stock.issued_this_month ?? 0} pcs</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Low Stock & Replenishment Alerts</p>
            {(alerts.low_stock ?? 0) + (alerts.out_of_stock ?? 0) === 0 ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">All clear</span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                {(alerts.low_stock ?? 0) + (alerts.out_of_stock ?? 0)} Requires Action
              </span>
            )}
          </div>
          {(alerts.low_stock ?? 0) + (alerts.out_of_stock ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm italic text-slate-400">All inventory items are well-stocked above reorder points.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.low_stock > 0 && <li className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">{alerts.low_stock} item(s) low on stock</li>}
              {alerts.out_of_stock > 0 && <li className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">{alerts.out_of_stock} item(s) out of stock</li>}
              {alerts.overdue_equipment > 0 && <li className="rounded-lg bg-rose-50 px-3 py-2 text-rose-800">{alerts.overdue_equipment} equipment item(s) overdue</li>}
              {alerts.missing_equipment > 0 && <li className="rounded-lg bg-rose-100 px-3 py-2 text-rose-900">{alerts.missing_equipment} equipment item(s) missing</li>}
            </ul>
          )}
        </div>
      </div>

      {/* Pending equipment requests */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="mb-1 text-sm font-semibold text-purple-900">Pending Technician Equipment Requests ({pendingRequests.length})</p>
        <p className="mb-3 text-xs text-slate-500">Review and approve/reject tool and equipment requests from technicians working on Job Cards.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Technician</th>
                <th className="py-2 pr-4">Requested Equipment</th>
                <th className="py-2 pr-4">Job Card</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingRequests.length === 0 ? (
                <tr><td colSpan={6} className="py-6 text-center italic text-slate-400">No pending equipment requests from technicians at this time.</td></tr>
              ) : (
                pendingRequests.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4">{r.technician}</td>
                    <td className="py-2 pr-4">{r.requested_equipment}</td>
                    <td className="py-2 pr-4">{r.job_card_id ?? '—'}</td>
                    <td className="py-2 pr-4 text-slate-500">{r.date?.slice(0, 10)}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">{r.status}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2 text-xs font-medium">
                        <button onClick={() => handleApprove(r.id)} className="text-emerald-700 hover:underline">Approve</button>
                        <button onClick={() => handleReject(r.id)} className="text-rose-600 hover:underline">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equipment accountability tracker */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Equipment Accountability & Checkout Tracker</p>
          <a href="/equipment/tracker" className="text-xs font-medium text-sky-700 hover:underline">Open full tracker →</a>
        </div>
        <p className="mb-3 text-xs text-slate-500">Monitor live location, assignment, return deadlines, and maintenance status of garage equipment.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-4">Equipment</th>
                <th className="py-2 pr-4">Equipment ID</th>
                <th className="py-2 pr-4">Assigned To</th>
                <th className="py-2 pr-4">Job Card</th>
                <th className="py-2 pr-4">Checkout Time</th>
                <th className="py-2 pr-4">Expected Return</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accountability.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center italic text-slate-400">No equipment records found matching the filter.</td></tr>
              ) : (
                accountability.map((eq, i) => (
                  <tr key={i} className={eq.status === 'Overdue' ? 'bg-rose-50/40' : ''}>
                    <td className="py-2 pr-4">{eq.equipment}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-500">{eq.equipment_id}</td>
                    <td className="py-2 pr-4">{eq.assigned_technician ?? '—'}</td>
                    <td className="py-2 pr-4">{eq.job_card_id ?? '—'}</td>
                    <td className="py-2 pr-4 text-slate-500">{eq.checkout_time?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-2 pr-4 text-slate-500">{eq.expected_return?.slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        eq.status === 'Overdue' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-sky-50 text-sky-700 ring-sky-600/20'
                      }`}>
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCheckout && <CheckoutSessionModal onClose={() => setShowCheckout(false)} />}
      {showReturn && <ReturnSessionModal onClose={() => setShowReturn(false)} />}
    </div>
  );
}

function QuickAction({ label, primary, onClick, href }) {
  const cls = primary
    ? 'rounded-lg bg-[#3c4a24] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f3a1c]'
    : 'rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50';

  if (href) {
    return <a href={href} className={cls}>{label}</a>;
  }
  return <button onClick={onClick} className={cls}>{label}</button>;
}

export default InventoryDashboardPage;

