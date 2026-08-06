import { FileText, Eye, Printer, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_PILL = {
  draft:    { bg: 'hsl(45 50% 93%)',  text: 'hsl(45 55% 36%)' },
  sent:     { bg: 'hsl(210 50% 93%)', text: 'hsl(210 60% 36%)' },
  approved: { bg: 'hsl(145 35% 93%)', text: 'hsl(145 40% 30%)' },
  rejected: { bg: 'hsl(0 50% 94%)',   text: 'hsl(0 58% 40%)' },
  expired:  { bg: 'hsl(0 0% 92%)',    text: 'hsl(0 0% 42%)' },
};

function StatusPill({ status }) {
  const s = STATUS_PILL[status?.toLowerCase()] ?? { bg: 'hsl(45 15% 93%)', text: 'hsl(90 8% 42%)' };
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: s.bg, color: s.text }}>{status ?? '—'}</span>
  );
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}

export function QuotationsTab({ customer }) {
  const quotations = [...(customer.quotations ?? [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Quotations</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{quotations.length} quotation{quotations.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          to={`/quotations/new?customerId=${customer.customer_id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white no-underline"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
        >
          <FileText className="h-4 w-4" /> New Quotation
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
              {['Quote No.', 'Date', 'Vehicle', 'Amount', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'hsl(90 8% 48%)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotations.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(90 8% 55%)' }}>
                No quotations found.
              </td></tr>
            ) : quotations.map((q, i) => (
              <tr key={q.quotation_id}
                style={{ borderBottom: i < quotations.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none', background: 'hsl(45 30% 99%)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(45 30% 99%)'; }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(90 8% 40%)' }}>
                  Q-{String(q.quotation_id).padStart(4, '0')}
                  {q.revision_no > 0 && (
                    <span className="ml-1 text-[9px]" style={{ color: 'hsl(90 8% 58%)' }}>rev.{q.revision_no}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(90 8% 40%)' }}>{fmt(q.created_at)}</td>
                <td className="px-4 py-3" style={{ color: 'hsl(90 8% 40%)' }}>
                  {q.vehicle ? `${q.vehicle.make} ${q.vehicle.model}` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'hsl(90 12% 18%)' }}>
                  ETB {parseFloat(q.total_amount ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-3"><StatusPill status={q.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <button title="View" className="rounded-lg p-1.5 transition-colors"
                      style={{ color: 'hsl(90 8% 48%)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 93%)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button title="Print" className="rounded-lg p-1.5 transition-colors"
                      style={{ color: 'hsl(90 8% 48%)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 93%)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                    {q.status === 'sent' && <>
                      <button title="Approve" className="rounded-lg p-1.5 transition-colors"
                        style={{ color: 'hsl(145 40% 36%)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(145 35% 93%)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                      <button title="Reject" className="rounded-lg p-1.5 transition-colors"
                        style={{ color: 'hsl(0 58% 44%)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(0 55% 96%)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <XCircle className="h-3.5 w-3.5" />
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
