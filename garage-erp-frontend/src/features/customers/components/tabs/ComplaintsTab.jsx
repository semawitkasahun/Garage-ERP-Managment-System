import { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_PILL = {
  open:     { bg: 'hsl(0 50% 94%)',  text: 'hsl(0 58% 40%)' },
  resolved: { bg: 'hsl(145 35% 93%)', text: 'hsl(145 40% 30%)' },
  closed:   { bg: 'hsl(0 0% 92%)',   text: 'hsl(0 0% 42%)' },
};

const PRIORITY_PILL = {
  low:    { bg: 'hsl(145 35% 93%)', text: 'hsl(145 40% 30%)' },
  medium: { bg: 'hsl(45 50% 93%)',  text: 'hsl(45 55% 36%)' },
  high:   { bg: 'hsl(22 55% 93%)',  text: 'hsl(22 65% 36%)' },
  urgent: { bg: 'hsl(0 50% 94%)',   text: 'hsl(0 58% 40%)' },
};

function Pill({ status, map }) {
  const s = map[status?.toLowerCase()] ?? { bg: 'hsl(45 15% 93%)', text: 'hsl(90 8% 42%)' };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: s.bg, color: s.text }}>{status ?? '—'}</span>
  );
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function ComplaintsTab({ customer }) {
  const [showForm, setShowForm] = useState(false);
  const complaints = [...(customer.complaints ?? [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Complaints & Feedback</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{complaints.length} record{complaints.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
        >
          <Plus className="h-4 w-4" /> Create Complaint
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl p-4" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
          <p className="text-sm font-medium mb-3" style={{ color: 'hsl(90 12% 18%)' }}>New Complaint</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium" style={{ color: 'hsl(90 12% 28%)' }}>Type</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'hsl(45 15% 83%)', background: 'white' }}>
                <option>complaint</option>
                <option>feedback</option>
                <option>suggestion</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'hsl(90 12% 28%)' }}>Priority</label>
              <select className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                style={{ borderColor: 'hsl(45 15% 83%)', background: 'white' }}>
                <option>low</option>
                <option>medium</option>
                <option>high</option>
                <option>urgent</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium" style={{ color: 'hsl(90 12% 28%)' }}>Description</label>
              <textarea rows={3} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none resize-none"
                style={{ borderColor: 'hsl(45 15% 83%)', background: 'white' }}
                placeholder="Describe the complaint or feedback…" />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'hsl(84 25% 32%)' }}>Submit</button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm font-medium"
              style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 8% 42%)' }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
              {['ID', 'Date', 'Type', 'Priority', 'Status', 'Description', 'Resolution', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'hsl(90 8% 48%)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {complaints.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(90 8% 55%)' }}>
                No complaints or feedback recorded.
              </td></tr>
            ) : complaints.map((c, i) => (
              <tr key={c.feedback_id}
                style={{ borderBottom: i < complaints.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none', background: 'hsl(45 30% 99%)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(45 30% 99%)'; }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(90 8% 40%)' }}>#{c.feedback_id}</td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(90 8% 40%)' }}>{fmt(c.created_at)}</td>
                <td className="px-4 py-3 text-xs capitalize" style={{ color: 'hsl(90 8% 40%)' }}>{c.type ?? '—'}</td>
                <td className="px-4 py-3"><Pill status={c.priority} map={PRIORITY_PILL} /></td>
                <td className="px-4 py-3"><Pill status={c.status} map={STATUS_PILL} /></td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="text-sm truncate" title={c.description}>{c.description ?? '—'}</p>
                </td>
                <td className="px-4 py-3 max-w-[160px]">
                  <p className="text-sm truncate" style={{ color: 'hsl(90 8% 48%)' }} title={c.resolution}>{c.resolution ?? '—'}</p>
                </td>
                <td className="px-4 py-3">
                  {c.status === 'open' && (
                    <button className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-colors"
                      style={{ border: '1px solid hsl(145 40% 78%)', color: 'hsl(145 42% 32%)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(145 35% 93%)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <CheckCircle2 className="h-3 w-3" /> Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
