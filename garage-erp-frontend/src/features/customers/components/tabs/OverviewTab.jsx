import { User, Phone, Mail, MapPin, Calendar, Car, DollarSign, Star, Clock, MessageCircle } from 'lucide-react';

function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid hsl(45 15% 91%)' }}>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
        style={{ background: accent ? `${accent}18` : 'hsl(45 15% 93%)' }}>
        <Icon className="h-3.5 w-3.5" style={{ color: accent ?? 'hsl(90 8% 48%)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 52%)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'hsl(90 12% 18%)' }}>{value ?? '—'}</p>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, accentBg }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: accentBg, border: `1px solid ${accent}30` }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: accent }}>{label}</span>
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
      <p className="font-display text-2xl font-bold" style={{ color: 'hsl(90 15% 12%)' }}>{value ?? '—'}</p>
    </div>
  );
}

export function OverviewTab({ customer }) {
  const totalSpending = customer.invoices
    ?.reduce((sum, inv) => sum + parseFloat(inv.amount_paid ?? 0), 0) ?? 0;

  const lastVisit = customer.appointments
    ?.filter(a => a.status === 'completed')
    ?.sort((a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start))[0]
    ?.scheduled_start;

  const preferredContact = customer.opt_in_sms && customer.opt_in_email ? 'SMS & Email'
    : customer.opt_in_sms ? 'SMS'
    : customer.opt_in_email ? 'Email'
    : 'Not specified';

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* KPI strip */}
      <div className="lg:col-span-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Customer Since" value={fmt(customer.created_at)} icon={Calendar} accent="hsl(84 30% 36%)" accentBg="hsl(84 20% 95%)" />
        <KpiCard label="Total Visits" value={customer.appointments?.filter(a => a.status === 'completed').length ?? 0} icon={Clock} accent="hsl(210 55% 42%)" accentBg="hsl(210 50% 95%)" />
        <KpiCard label="Total Vehicles" value={customer.vehicles?.length ?? 0} icon={Car} accent="hsl(265 40% 44%)" accentBg="hsl(265 35% 95%)" />
        <KpiCard label="Lifetime Spending" value={`ETB ${totalSpending.toLocaleString(undefined, { minimumFractionDigits: 0 })}`} icon={DollarSign} accent="hsl(145 42% 34%)" accentBg="hsl(145 35% 95%)" />
        <KpiCard label="Last Visit" value={fmt(lastVisit)} icon={Calendar} accent="hsl(42 65% 38%)" accentBg="hsl(42 55% 95%)" />
        <KpiCard label="Segment" value={customer.segment ?? 'Walk-in'} icon={Star} accent="hsl(22 65% 38%)" accentBg="hsl(22 55% 95%)" />
      </div>

      {/* Contact details */}
      <div className="rounded-xl p-5 lg:col-span-2" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
        <h3 className="font-display text-sm font-semibold mb-1" style={{ color: 'hsl(90 15% 14%)' }}>Contact Information</h3>
        <p className="text-xs mb-3" style={{ color: 'hsl(90 8% 52%)' }}>Primary details on file for this customer</p>
        <div>
          <InfoRow icon={Phone} label="Phone Number" value={customer.phone} />
          <InfoRow icon={Mail} label="Email Address" value={customer.email} />
          <InfoRow icon={MapPin} label="Address" value={[customer.address, customer.city].filter(Boolean).join(', ')} />
          <InfoRow icon={Phone} label="Emergency Contact" value={customer.emergency_contact} />
          <InfoRow icon={MessageCircle} label="Preferred Contact" value={preferredContact} accent="hsl(84 30% 36%)" />
          <InfoRow icon={User} label="Customer Type" value={customer.customer_type} />
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl p-5" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
        <h3 className="font-display text-sm font-semibold mb-1" style={{ color: 'hsl(90 15% 14%)' }}>Staff Notes</h3>
        <p className="text-xs mb-3" style={{ color: 'hsl(90 8% 52%)' }}>Private notes visible to staff only</p>
        {customer.notes ? (
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(90 10% 28%)' }}>{customer.notes}</p>
        ) : (
          <p className="text-sm italic" style={{ color: 'hsl(90 8% 62%)' }}>No notes recorded for this customer.</p>
        )}

        {/* Recent activity */}
        <div className="mt-5">
          <h4 className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: 'hsl(90 8% 52%)' }}>Branch</h4>
          <p className="text-sm font-medium" style={{ color: 'hsl(90 12% 20%)' }}>{customer.branch?.name ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}
