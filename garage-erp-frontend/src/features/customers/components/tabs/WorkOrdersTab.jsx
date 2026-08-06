import { Wrench } from 'lucide-react';

const STATUS_PILL = {
  pending:     { bg: 'hsl(45 50% 93%)',  text: 'hsl(45 55% 36%)' },
  in_progress: { bg: 'hsl(210 50% 93%)', text: 'hsl(210 60% 36%)' },
  completed:   { bg: 'hsl(145 35% 93%)', text: 'hsl(145 40% 30%)' },
  cancelled:   { bg: 'hsl(0 50% 94%)',   text: 'hsl(0 58% 40%)' },
  on_hold:     { bg: 'hsl(0 0% 92%)',    text: 'hsl(0 0% 42%)' },
};

function StatusPill({ status }) {
  const key = status?.toLowerCase().replace(' ', '_').replace('-', '_');
  const s = STATUS_PILL[key] ?? { bg: 'hsl(45 15% 93%)', text: 'hsl(90 8% 42%)' };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: s.bg, color: s.text }}>{status ?? '—'}</span>
  );
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function WorkOrdersTab({ customer }) {
  const workOrders = [...(customer.workOrders ?? [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Work Orders</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{workOrders.length} work order{workOrders.length !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
              {['Work Order No.', 'Date', 'Vehicle', 'Job Cards', 'Status', 'Completion Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'hsl(90 8% 48%)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workOrders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(90 8% 55%)' }}>
                No work orders found.
              </td></tr>
            ) : workOrders.map((wo, i) => (
              <tr key={wo.work_order_id}
                style={{ borderBottom: i < workOrders.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none', background: 'hsl(45 30% 99%)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(45 30% 99%)'; }}>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs rounded px-1.5 py-0.5"
                    style={{ background: 'hsl(45 15% 93%)', color: 'hsl(90 8% 38%)' }}>
                    WO-{String(wo.work_order_id).padStart(4, '0')}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(90 8% 40%)' }}>{fmt(wo.created_at)}</td>
                <td className="px-4 py-3 font-medium" style={{ color: 'hsl(90 12% 18%)' }}>
                  {wo.vehicle ? `${wo.vehicle.make} ${wo.vehicle.model}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" style={{ color: 'hsl(90 8% 52%)' }} />
                    <span className="text-sm" style={{ color: 'hsl(90 8% 40%)' }}>{wo.jobCards?.length ?? 0}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><StatusPill status={wo.status} /></td>
                <td className="px-4 py-3 text-xs" style={{ color: 'hsl(90 8% 40%)' }}>
                  {fmt(wo.completed_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
