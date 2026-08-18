import { useState, useEffect, useMemo } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────── */
function toDate(str) {
  if (!str) return null;
  // Parse as local date to avoid UTC shift
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(str) {
  if (!str) return '';
  const d = toDate(str);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function monthKey(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 7); // "YYYY-MM"
}

/**
 * Returns all existing periods that overlap [start, end].
 * @param {string} start
 * @param {string} end
 * @param {Array}  existingPeriods – array of periods already in DB
 * @param {number|null} excludeId – exclude one period (for edit mode)
 */
function findOverlaps(start, end, existingPeriods = [], excludeId = null) {
  if (!start || !end) return [];
  const s = toDate(start);
  const e = toDate(end);
  return existingPeriods.filter((p) => {
    if (excludeId && p.payroll_period_id === excludeId) return false;
    const ps = toDate(p.start_date);
    const pe = toDate(p.end_date);
    // Overlaps if neither is strictly before/after
    return !(e < ps || s > pe);
  });
}

/**
 * Counts how many existing periods fall (even partially) in the same calendar
 * month as `startDate`.
 */
function countPeriodsInMonth(startDate, existingPeriods = [], excludeId = null) {
  if (!startDate) return 0;
  const mk = monthKey(startDate);
  return existingPeriods.filter((p) => {
    if (excludeId && p.payroll_period_id === excludeId) return false;
    return monthKey(p.start_date) === mk || monthKey(p.end_date) === mk;
  }).length;
}

/* ─────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────── */
export function CreatePeriodModal({ open, onClose, onCreate, loading, existingPeriods = [] }) {
  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [form, setForm] = useState({
    name: '',
    start_date: defaultStart,
    end_date: '',
  });
  const [touched, setTouched] = useState({});

  // Auto-fill end date when start changes (default to end of month)
  useEffect(() => {
    if (form.start_date) {
      const [y, m] = form.start_date.split('-').map(Number);
      const lastDay = new Date(y, m, 0); // day 0 of next month = last day of current month
      const endStr = `${y}-${String(m).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      setForm((prev) => ({ ...prev, end_date: endStr }));
    }
  }, [form.start_date]);

  // Auto-generate a name based on month
  useEffect(() => {
    if (form.start_date && !touched.name) {
      const d = toDate(form.start_date);
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const periodsInMonth = countPeriodsInMonth(form.start_date, existingPeriods);
      const label = periodsInMonth > 0 ? `${monthName} (Period ${periodsInMonth + 1})` : monthName;
      setForm((prev) => ({ ...prev, name: label }));
    }
  }, [form.start_date, existingPeriods, touched.name]);

  /* ── Derived validation ── */
  const errors = useMemo(() => {
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Period name is required.';

    const s = toDate(form.start_date);
    const e = toDate(form.end_date);

    if (!form.start_date) errs.start_date = 'Start date is required.';
    if (!form.end_date)   errs.end_date   = 'End date is required.';
    if (s && e && e <= s) errs.end_date = 'End date must be after start date.';

    if (form.start_date && form.end_date && s && e && e > s) {
      // Max 4 per month
      const inMonth = countPeriodsInMonth(form.start_date, existingPeriods);
      if (inMonth >= 4) {
        errs.start_date = `Maximum of 4 payroll periods per calendar month has been reached for ${toDate(form.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.`;
      }

      // Overlap check
      const overlaps = findOverlaps(form.start_date, form.end_date, existingPeriods);
      if (overlaps.length > 0) {
        const conflict = overlaps[0];
        errs.end_date = `Overlaps with "${conflict.name}" (${formatDate(conflict.start_date)} – ${formatDate(conflict.end_date)}).`;
      }
    }

    return errs;
  }, [form, existingPeriods]);

  const hasErrors = Object.keys(errors).length > 0;

  /* ── Month quota ── */
  const periodsInMonth = useMemo(
    () => countPeriodsInMonth(form.start_date, existingPeriods),
    [form.start_date, existingPeriods]
  );
  const monthLabel = form.start_date
    ? toDate(form.start_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'name') setTouched((prev) => ({ ...prev, name: true }));
  };
  const blur = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, start_date: true, end_date: true });
    if (hasErrors) return;
    onCreate({ name: form.name.trim(), start_date: form.start_date, end_date: form.end_date });
  };

  const handleClose = () => {
    setForm({ name: '', start_date: defaultStart, end_date: '' });
    setTouched({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl bg-white border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: 'hsl(84 20% 91%)' }}>
              <Calendar className="h-4 w-4" style={{ color: 'hsl(84 30% 28%)' }} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Create Payroll Period</h2>
              <p className="text-xs text-muted-foreground">Define start and end dates for this pay period</p>
            </div>
          </div>
          <button onClick={handleClose} disabled={loading} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Monthly quota bar */}
          {form.start_date && (
            <div className="rounded-lg border p-3.5 space-y-2" style={{ borderColor: periodsInMonth >= 4 ? 'hsl(0 50% 80%)' : 'hsl(84 20% 80%)', background: periodsInMonth >= 4 ? 'hsl(0 50% 97%)' : 'hsl(84 20% 97%)' }}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium" style={{ color: periodsInMonth >= 4 ? 'hsl(0 50% 40%)' : 'hsl(84 30% 30%)' }}>
                  {monthLabel} — Payroll Periods
                </span>
                <span className="font-mono font-semibold" style={{ color: periodsInMonth >= 4 ? 'hsl(0 50% 40%)' : 'hsl(84 30% 28%)' }}>
                  {periodsInMonth} / 4
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (periodsInMonth / 4) * 100)}%`,
                    background: periodsInMonth >= 4 ? 'hsl(0 50% 55%)' : periodsInMonth >= 3 ? 'hsl(30 70% 50%)' : 'hsl(84 30% 45%)',
                  }}
                />
              </div>
              <p className="text-[11px]" style={{ color: periodsInMonth >= 4 ? 'hsl(0 50% 45%)' : 'hsl(84 20% 40%)' }}>
                {periodsInMonth >= 4
                  ? '⛔ No more periods can be created for this month.'
                  : `${4 - periodsInMonth} slot${4 - periodsInMonth !== 1 ? 's' : ''} remaining in this month`}
              </p>
            </div>
          )}

          {/* Period Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5 text-foreground">Period Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              onBlur={() => blur('name')}
              placeholder="e.g. August 2026 – Period 1"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${touched.name && errors.name ? 'border-red-400 focus:ring-red-200' : 'border-input focus:ring-foreground/15'}`}
            />
            {touched.name && errors.name && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{errors.name}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                onBlur={() => blur('start_date')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${touched.start_date && errors.start_date ? 'border-red-400 focus:ring-red-200' : 'border-input focus:ring-foreground/15'}`}
              />
              {touched.start_date && errors.start_date && (
                <p className="text-xs text-red-600 mt-1 flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-foreground">End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => set('end_date', e.target.value)}
                onBlur={() => blur('end_date')}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:ring-2 ${touched.end_date && errors.end_date ? 'border-red-400 focus:ring-red-200' : 'border-input focus:ring-foreground/15'}`}
              />
              {touched.end_date && errors.end_date && (
                <p className="text-xs text-red-600 mt-1 flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Preview of valid period */}
          {!hasErrors && form.start_date && form.end_date && (
            <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm" style={{ background: 'hsl(84 20% 96%)', borderColor: 'hsl(84 20% 82%)' }}>
              <CheckCircle className="h-4 w-4 shrink-0" style={{ color: 'hsl(84 30% 40%)' }} />
              <span style={{ color: 'hsl(84 20% 28%)' }}>
                <strong>{form.name}</strong>:{' '}
                {formatDate(form.start_date)} <ChevronRight className="inline h-3 w-3" /> {formatDate(form.end_date)}
              </span>
            </div>
          )}

          {/* Policy note */}
          <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Policy:</span> Each calendar month can have a maximum of <strong>4 payroll periods</strong>. Date ranges cannot overlap an existing period.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-1 border-t border-border">
            <button type="button" onClick={handleClose} disabled={loading} className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent/30 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (Object.keys(touched).length > 0 && hasErrors)}
              className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              {loading && <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Create Period
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
