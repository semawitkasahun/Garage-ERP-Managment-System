import { Eye, Printer, CreditCard, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_PILL = {
  paid:    { bg: 'hsl(145 35% 93%)', text: 'hsl(145 40% 30%)' },
  unpaid:  { bg: 'hsl(0 50% 94%)',   text: 'hsl(0 58% 40%)' },
  partial: { bg: 'hsl(45 50% 93%)',  text: 'hsl(45 55% 36%)' },
  overdue: { bg: 'hsl(22 55% 93%)',  text: 'hsl(22 65% 36%)' },
  void:    { bg: 'hsl(0 0% 92%)',    text: 'hsl(0 0% 42%)' },
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

export function BillingTab({ customer }) {
  const invoices = [...(customer.invoices ?? [])].sort(
    (a, b) => new Date(b.invoice_date ?? b.created_at) - new Date(a.invoice_date ?? a.created_at)
  );

  const totalOwed = invoices.reduce((s, inv) => s + parseFloat(inv.total_amount ?? 0), 0);
  const totalPaid = invoices.reduce((s, inv) => s + parseFloat(inv.amount_paid ?? 0), 0);
  const totalDue = totalOwed - totalPaid;

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Total Invoiced', value: `ETB ${totalOwed.toLocaleString()}`, color: 'hsl(90 12% 20%)' },
          { label: 'Total Paid', value: `ETB ${totalPaid.toLocaleString()}`, color: 'hsl(145 40% 32%)' },
          { label: 'Outstanding', value: `ETB ${totalDue.toLocaleString()}`, color: totalDue > 0 ? 'hsl(0 58% 40%)' : 'hsl(145 40% 32%)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 52%)' }}>{label}</p>
            <p className="font-display text-xl font-bold mt-1" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Invoices</h3>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          to={`/invoices/new?customerId=${customer.customer_id}`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white no-underline"
          style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
        >
          <Receipt className="h-4 w-4" /> New Invoice
        </Link>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(45 15% 88%)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'hsl(45 15% 97%)', borderBottom: '1px solid hsl(45 15% 89%)' }}>
              {['Invoice No.', 'Date', 'Total Amount', 'Amount Paid', 'Remaining', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[0.1em]"
                  style={{ color: 'hsl(90 8% 48%)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'hsl(90 8% 55%)' }}>
                No invoices found.
              </td></tr>
            ) : invoices.map((inv, i) => {
              const remaining = parseFloat(inv.total_amount ?? 0) - parseFloat(inv.amount_paid ?? 0);
              return (
                <tr key={inv.invoice_id}
                  style={{ borderBottom: i < invoices.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none', background: 'hsl(45 30% 99%)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(45 30% 99%)'; }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(90 8% 38%)' }}>
                    {inv.invoice_no ?? `INV-${String(inv.invoice_id).padStart(4, '0')}`}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'hsl(90 8% 40%)' }}>
                    {fmt(inv.invoice_date ?? inv.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'hsl(90 12% 18%)' }}>
                    ETB {parseFloat(inv.total_amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'hsl(145 40% 32%)' }}>
                    ETB {parseFloat(inv.amount_paid ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: remaining > 0 ? 'hsl(0 58% 40%)' : 'hsl(145 40% 32%)' }}>
                    ETB {remaining.toLocaleString()}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={inv.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button title="View" className="rounded-lg p-1.5 transition-colors" style={{ color: 'hsl(90 8% 48%)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 93%)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button title="Print" className="rounded-lg p-1.5 transition-colors" style={{ color: 'hsl(90 8% 48%)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 93%)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      {inv.status !== 'paid' && (
                        <button title="Record Payment" className="rounded-lg p-1.5 transition-colors" style={{ color: 'hsl(84 30% 38%)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 20% 93%)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <CreditCard className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
