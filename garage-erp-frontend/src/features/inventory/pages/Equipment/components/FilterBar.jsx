import React from 'react';
import { Search, Plus, Filter, RotateCcw, X } from 'lucide-react';

const CATEGORIES = [
  'Hand Tools',
  'Power Tools',
  'Diagnostic Equipment',
  'Electrical Equipment',
  'Lifting Equipment',
  'Workshop Equipment',
  'Safety Equipment',
  'Cleaning Equipment',
  'Other',
];

const STATUSES = [
  'Available',
  'Checked Out',
  'Under Maintenance',
  'Damaged',
  'Missing',
  'Retired',
];

const CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Damaged',
  'N/A',
];

export default function FilterBar({
  filters,
  onChange,
  onRegisterClick,
  stats,
}) {
  const handleFilterChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const handleClear = () => {
    onChange({
      search: '',
      category: '',
      status: '',
      availability: '',
      condition: '',
      page: 1,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category ||
    filters.status ||
    filters.availability ||
    filters.condition;

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      {/* Top row: Search, Availability Pills & Register Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code (EQ-00001), name, brand, serial, location…"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-8 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => handleFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Availability quick filter tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs">
          <button
            onClick={() => handleFilterChange('availability', '')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              !filters.availability
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Equipment {stats?.total ? `(${stats.total})` : ''}
          </button>
          <button
            onClick={() => handleFilterChange('availability', 'available')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              filters.availability === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Available {stats?.available ? `(${stats.available})` : ''}
          </button>
          <button
            onClick={() => handleFilterChange('availability', 'unavailable')}
            className={`rounded-lg px-3 py-1.5 font-medium transition-all ${
              filters.availability === 'unavailable'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unavailable {stats?.unavailable_summary ? `(${stats.unavailable_summary})` : ''}
          </button>
        </div>

        {/* Register Equipment Primary CTA */}
        <button
          onClick={onRegisterClick}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Register Equipment
        </button>
      </div>

      {/* Bottom row: Dropdown filters */}
      <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3 text-xs">
        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filters:
        </span>

        {/* Category Filter */}
        <select
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:bg-white focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* Condition Filter */}
        <select
          value={filters.condition || ''}
          onChange={(e) => handleFilterChange('condition', e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-500 focus:bg-white focus:outline-none"
        >
          <option value="">All Conditions</option>
          {CONDITIONS.map((c) => (
            <option key={c} value={c}>
              Condition: {c}
            </option>
          ))}
        </select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
