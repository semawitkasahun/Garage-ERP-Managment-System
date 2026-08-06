import { ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const FUEL_BARS = { empty: 0, quarter: 1, half: 2, three_quarter: 3, full: 4 };

function FuelIndicator({ level }) {
  const filled = FUEL_BARS[level?.toLowerCase().replace('-', '_').replace(' ', '_')] ?? 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-2.5 w-4 rounded-sm"
          style={{ background: i <= filled ? 'hsl(84 35% 42%)' : 'hsl(45 15% 88%)' }} />
      ))}
      <span className="ml-1 text-[11px] capitalize" style={{ color: 'hsl(90 8% 48%)' }}>{level ?? '—'}</span>
    </div>
  );
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

export function CheckInsTab({ customer }) {
  const checkins = [...(customer.vehicleCheckins ?? [])].sort(
    (a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Check-In History</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{checkins.length} check-in{checkins.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <Link
          to={`/checkins/new?customerId=${customer.customer_id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white no-underline"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
        >
          <ClipboardCheck className="h-4 w-4" /> New Check-In
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
              {['Check-In Date', 'Vehicle', 'Mileage', 'Fuel Level', 'Complaint / Notes', 'Advisor'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'hsl(90 8% 48%)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checkins.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(90 8% 55%)' }}>
                No check-in records found.
              </td></tr>
            ) : checkins.map((c, i) => (
              <tr key={c.checkin_id}
                style={{ borderBottom: i < checkins.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none', background: 'hsl(45 30% 99%)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(45 30% 99%)'; }}>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'hsl(90 8% 40%)' }}>
                  {fmt(c.checked_in_at)}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: 'hsl(90 12% 18%)' }}>
                  {c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}` : '—'}
                  {c.vehicle?.plate_number && (
                    <span className="ml-1.5 font-mono text-[10px] rounded px-1 py-0.5"
                      style={{ background: 'hsl(45 15% 93%)', color: 'hsl(90 8% 42%)' }}>
                      {c.vehicle.plate_number}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(90 8% 40%)' }}>
                  {c.mileage_in ? `${c.mileage_in.toLocaleString()} km` : '—'}
                </td>
                <td className="px-4 py-3">
                  <FuelIndicator level={c.fuel_level} />
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="text-sm truncate" style={{ color: 'hsl(90 10% 28%)' }}
                    title={c.customer_complaint}>
                    {c.customer_complaint ?? <span style={{ color: 'hsl(90 8% 62%)' }}>—</span>}
                  </p>
                </td>
                <td className="px-4 py-3" style={{ color: 'hsl(90 8% 40%)' }}>
                  {c.checkedInBy?.employee
                    ? `${c.checkedInBy.employee.first_name} ${c.checkedInBy.employee.last_name}`
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
