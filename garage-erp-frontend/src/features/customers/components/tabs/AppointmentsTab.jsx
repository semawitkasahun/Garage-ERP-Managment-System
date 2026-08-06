import { CalendarPlus, RotateCcw, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_PILL = {
  booked:    { bg: 'hsl(210 50% 93%)', text: 'hsl(210 60% 36%)' },
  confirmed: { bg: 'hsl(84 20% 91%)',  text: 'hsl(84 30% 28%)' },
  completed: { bg: 'hsl(145 35% 93%)', text: 'hsl(145 40% 30%)' },
  cancelled: { bg: 'hsl(0 50% 94%)',   text: 'hsl(0 58% 40%)' },
  'no-show': { bg: 'hsl(45 50% 93%)',  text: 'hsl(45 55% 36%)' },
};

function StatusPill({ status }) {
  const s = STATUS_PILL[status?.toLowerCase()] ?? { bg: 'hsl(45 15% 93%)', text: 'hsl(90 8% 42%)' };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: s.bg, color: s.text }}>
      {status ?? '—'}
    </span>
  );
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function AppointmentsTab({ customer }) {
  const appointments = [...(customer.appointments ?? [])].sort(
    (a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Appointment History</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{appointments.length} appointment{appointments.length !== 1 ? 's' : ''} on record</p>
        </div>
        <Link
          to={`/appointments/new?customerId=${customer.customer_id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white no-underline"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
        >
          <CalendarPlus className="h-4 w-4" /> Book Appointment
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
              {['Date & Time', 'Service', 'Vehicle', 'Technician', 'Bay', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'hsl(90 8% 48%)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(90 8% 55%)' }}>
                No appointments found.
              </td></tr>
            ) : appointments.map((a, i) => (
              <tr key={a.appointment_id}
                style={{ borderBottom: i < appointments.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none', background: 'hsl(45 30% 99%)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(45 30% 99%)'; }}>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'hsl(90 8% 40%)' }}>
                  {fmt(a.scheduled_start)}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: 'hsl(90 12% 18%)' }}>
                  {a.service_type ?? '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'hsl(90 8% 40%)' }}>
                  {a.vehicle ? `${a.vehicle.make} ${a.vehicle.model}` : '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'hsl(90 8% 40%)' }}>
                  {a.technician?.employee
                    ? `${a.technician.employee.first_name} ${a.technician.employee.last_name}`
                    : '—'}
                </td>
                <td className="px-4 py-3" style={{ color: 'hsl(90 8% 40%)' }}>
                  {a.bay?.bay_name ?? a.bay?.name ?? '—'}
                </td>
                <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {['booked', 'confirmed'].includes(a.status) && <>
                      <button className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
                        style={{ border: '1px solid hsl(45 15% 83%)', color: 'hsl(90 8% 38%)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 94%)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <RotateCcw className="h-3 w-3" /> Reschedule
                      </button>
                      <button className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
                        style={{ border: '1px solid hsl(0 50% 88%)', color: 'hsl(0 58% 44%)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(0 55% 96%)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <XCircle className="h-3 w-3" /> Cancel
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
