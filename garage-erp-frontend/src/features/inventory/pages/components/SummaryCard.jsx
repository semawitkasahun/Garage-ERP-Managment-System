export default function SummaryCard({ label, value, tone = 'default' }) {
  const toneCls = {
    default: 'text-slate-900',
    warn: 'text-amber-600',
    danger: 'text-rose-600',
    info: 'text-sky-600',
    success: 'text-emerald-600',
  }[tone];

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneCls}`}>{value ?? 0}</p>
    </div>
  );
}
