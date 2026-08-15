import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

const JOB_TITLES = ['Technician', 'Service Advisor', 'Supervisor', 'HR', 'Finance', 'Manager', 'Admin', 'Owner'];
const EMPLOYMENT_STATUSES = ['active', 'inactive', 'on_leave', 'terminated'];
const DEPARTMENTS = ['Service', 'Administration', 'Finance', 'HR', 'Management'];

export function FilterBar({ filters, onFiltersChange, onClearFilters }) {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
              <select
                value={filters.department || ''}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Job Title Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job Title</label>
              <select
                value={filters.job_title || ''}
                onChange={(e) => handleFilterChange('job_title', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">All Job Titles</option>
                {JOB_TITLES.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>

            {/* Employment Status Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employment Status</label>
              <select
                value={filters.employment_status || ''}
                onChange={(e) => handleFilterChange('employment_status', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">All Statuses</option>
                {EMPLOYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {/* Hire Date From Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hire Date From</label>
              <input
                type="date"
                value={filters.hire_date_from || ''}
                onChange={(e) => handleFilterChange('hire_date_from', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>

            {/* Hire Date To Filter */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hire Date To</label>
              <input
                type="date"
                value={filters.hire_date_to || ''}
                onChange={(e) => handleFilterChange('hire_date_to', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
