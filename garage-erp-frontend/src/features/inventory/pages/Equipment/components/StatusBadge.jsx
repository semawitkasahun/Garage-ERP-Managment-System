import React from 'react';

const STATUS_CONFIG = {
  Available: {
    label: 'Available',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  'Checked Out': {
    label: 'Checked Out',
    className: 'bg-sky-50 text-sky-700 ring-sky-600/20',
    dot: 'bg-sky-500',
  },
  'Under Maintenance': {
    label: 'Under Maintenance',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  Maintenance: {
    label: 'Under Maintenance',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  Damaged: {
    label: 'Damaged',
    className: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-500',
  },
  Missing: {
    label: 'Missing',
    className: 'bg-purple-50 text-purple-700 ring-purple-600/20',
    dot: 'bg-purple-500',
  },
  Retired: {
    label: 'Retired',
    className: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    dot: 'bg-slate-400',
  },
  Overdue: {
    label: 'Overdue',
    className: 'bg-red-50 text-red-700 ring-red-600/20 animate-pulse',
    dot: 'bg-red-500',
  },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    className: 'bg-slate-100 text-slate-600 ring-slate-400/20',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function ConditionBadge({ condition }) {
  if (!condition || condition === 'N/A' || condition === 'none') {
    return (
      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        N/A
      </span>
    );
  }

  const styles = {
    Excellent: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    Good: 'bg-teal-50 text-teal-700 ring-teal-600/20',
    Fair: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    Damaged: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    Poor: 'bg-orange-50 text-orange-700 ring-orange-600/20',
    New: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  };

  const cls = styles[condition] || 'bg-slate-100 text-slate-600 ring-slate-400/20';

  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {condition}
    </span>
  );
}

export default StatusBadge;
