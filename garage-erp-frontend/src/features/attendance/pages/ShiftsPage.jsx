import { useState } from 'react';
import { Clock, Plus, Edit, Trash2, Users, Calendar, Settings, AlertCircle, Search, Filter, X, ChevronDown, TrendingUp, Building } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useShifts, useCreateShift, useUpdateShift, useDeleteShift } from '@/features/attendance/hooks/useShifts';
import { useDepartments } from '@/features/attendance/hooks/useDepartments';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const SHIFT_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

const SHIFT_TEMPLATES = [
  {
    name: 'Morning Shift',
    start_time: '08:00',
    end_time: '17:00',
    break_start: '12:00',
    break_end: '13:00',
    break_duration_minutes: 60,
    expected_hours: 8,
    description: 'Standard morning shift'
  },
  {
    name: 'Afternoon Shift',
    start_time: '14:00',
    end_time: '22:00',
    break_start: '18:00',
    break_end: '19:00',
    break_duration_minutes: 60,
    expected_hours: 8,
    description: 'Afternoon to evening shift'
  },
  {
    name: 'Night Shift',
    start_time: '22:00',
    end_time: '06:00',
    break_start: '02:00',
    break_end: '03:00',
    break_duration_minutes: 60,
    expected_hours: 8,
    description: 'Overnight shift'
  },
];

export function ShiftsPage() {
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [filters, setFilters] = useState({
    branch_id: '',
    department_id: '',
    is_active: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: shifts, isLoading, error } = useShifts({ branch_id: user?.branch_id, ...filters });
  const { data: departments } = useDepartments({ branch_id: user?.branch_id });
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const deleteShift = useDeleteShift();

  const [formData, setFormData] = useState({
    name: '',
    branch_id: user?.branch_id || '',
    department_id: '',
    start_time: '08:00',
    end_time: '17:00',
    break_start: '12:00',
    break_end: '13:00',
    break_duration_minutes: 60,
    expected_hours: 8,
    overtime_threshold: 8,
    overtime_rate: 1.5,
    grace_period_minutes: 15,
    pattern: 'daily',
    working_days: [1, 2, 3, 4, 5],
    is_active: true,
  });

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await createShift.mutateAsync(formData);
      setShowCreateModal(false);
      resetFormData();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to create shift');
    }
  };

  const handleUpdateShift = async (e) => {
    e.preventDefault();
    try {
      await updateShift.mutateAsync({ shiftId: selectedShift.shift_id, payload: formData });
      setShowEditModal(false);
      setSelectedShift(null);
      resetFormData();
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to update shift');
    }
  };

  const handleDeleteShift = async (shift) => {
    if (!confirm(`Delete shift "${shift.name}"?`)) return;
    try {
      await deleteShift.mutateAsync(shift.shift_id);
    } catch (err) {
      alert(err.response?.data?.message ?? 'Failed to delete shift');
    }
  };

  const handleEditShift = (shift) => {
    setSelectedShift(shift);
    setFormData({
      name: shift.name,
      branch_id: shift.branch_id || '',
      department_id: shift.department_id || '',
      start_time: shift.start_time?.substring(0, 5) || '08:00',
      end_time: shift.end_time?.substring(0, 5) || '17:00',
      break_start: shift.break_start?.substring(0, 5) || '12:00',
      break_end: shift.break_end?.substring(0, 5) || '13:00',
      break_duration_minutes: shift.break_duration_minutes || 60,
      expected_hours: shift.expected_hours || 8,
      overtime_threshold: shift.overtime_threshold || 8,
      overtime_rate: shift.overtime_rate || 1.5,
      grace_period_minutes: shift.grace_period_minutes || 15,
      pattern: shift.pattern || 'daily',
      working_days: shift.working_days || [1, 2, 3, 4, 5],
      is_active: shift.is_active ?? true,
    });
    setShowEditModal(true);
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      branch_id: user?.branch_id || '',
      department_id: '',
      start_time: '08:00',
      end_time: '17:00',
      break_start: '12:00',
      break_end: '13:00',
      break_duration_minutes: 60,
      expected_hours: 8,
      overtime_threshold: 8,
      overtime_rate: 1.5,
      grace_period_minutes: 15,
      pattern: 'daily',
      working_days: [1, 2, 3, 4, 5],
      is_active: true,
    });
  };

  const applyTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      name: template.name,
      start_time: template.start_time,
      end_time: template.end_time,
      break_start: template.break_start,
      break_end: template.break_end,
      break_duration_minutes: template.break_duration_minutes,
      expected_hours: template.expected_hours,
    }));
  };

  const toggleWorkingDay = (dayValue) => {
    setFormData(prev => ({
      ...prev,
      working_days: prev.working_days.includes(dayValue)
        ? prev.working_days.filter(d => d !== dayValue)
        : [...prev.working_days, dayValue]
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    setFilters({ branch_id: '', department_id: '', is_active: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  const navSections = getNavSections(user?.role);

  return (
    <DashboardLayout navSections={navSections} pageTitle="Shift Scheduling" roleLabel={user?.username ?? 'Staff'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Shift Scheduling</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee shifts and working schedules</p>
        </div>
        <button
          onClick={() => { resetFormData(); setShowCreateModal(true); }}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: 'hsl(84 25% 30%)' }}
        >
          <Plus className="h-4 w-4" /> Add Shift
        </button>
      </div>

      {/* Filter Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search shifts..."
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
              onClick={handleClearFilters}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                <select
                  value={filters.department_id || ''}
                  onChange={(e) => handleFilterChange('department_id', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Departments</option>
                  {departments?.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                <select
                  value={filters.is_active || ''}
                  onChange={(e) => handleFilterChange('is_active', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shifts Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-left">
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Shift Name</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Department</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Working Hours</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Break</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Expected Hours</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Pattern</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <p className="text-muted-foreground">Failed to load shifts. Please try again.</p>
                    </div>
                  </td>
                </tr>
              ) : shifts && shifts.length > 0 ? (
                shifts.map((shift) => (
                  <tr key={shift.shift_id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium text-foreground">{shift.name}</span>
                        <p className="text-xs text-muted-foreground">{shift.branch?.name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {shift.department?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {shift.start_time?.substring(0, 5)} - {shift.end_time?.substring(0, 5)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {shift.break_start?.substring(0, 5)} - {shift.break_end?.substring(0, 5)} ({shift.break_duration_minutes}m)
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{shift.expected_hours}h</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{shift.pattern}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        shift.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {shift.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditShift(shift)}
                          className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(shift)}
                          className="p-1.5 rounded-md border border-border hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No shifts found</p>
                      <p className="text-sm text-muted-foreground">Create your first shift to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {showCreateModal ? 'Create New Shift' : 'Edit Shift'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setSelectedShift(null);
                  resetFormData();
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={showCreateModal ? handleCreateShift : handleUpdateShift} className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Shift Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      <option value="">No Department</option>
                      {departments?.map((dept) => (
                        <option key={dept.department_id} value={dept.department_id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pattern</label>
                    <select
                      value={formData.pattern}
                      onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    >
                      {SHIFT_PATTERNS.map((pattern) => (
                        <option key={pattern.value} value={pattern.value}>{pattern.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Shift Templates */}
                {showCreateModal && (
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-medium text-muted-foreground mb-3">Quick Templates</h4>
                    <div className="flex flex-wrap gap-2">
                      {SHIFT_TEMPLATES.map((template) => (
                        <button
                          key={template.name}
                          type="button"
                          onClick={() => applyTemplate(template)}
                          className="px-3 py-2 rounded-md border border-border text-xs font-medium hover:bg-accent transition-colors"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Working Hours */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Working Hours
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Break Start</label>
                    <input
                      type="time"
                      value={formData.break_start}
                      onChange={(e) => setFormData({ ...formData, break_start: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Break End</label>
                    <input
                      type="time"
                      value={formData.break_end}
                      onChange={(e) => setFormData({ ...formData, break_end: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Overtime Settings */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Overtime Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Expected Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.expected_hours}
                      onChange={(e) => setFormData({ ...formData, expected_hours: parseFloat(e.target.value) })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Overtime Threshold (hours)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.overtime_threshold}
                      onChange={(e) => setFormData({ ...formData, overtime_threshold: parseFloat(e.target.value) })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Overtime Rate</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.overtime_rate}
                      onChange={(e) => setFormData({ ...formData, overtime_rate: parseFloat(e.target.value) })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Working Days */}
              {formData.pattern === 'custom' && (
                <div className="space-y-4">
                  <h3 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Working Days
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkingDay(day.value)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          formData.working_days.includes(day.value)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-border"
                />
                <label htmlFor="is_active" className="text-sm">Active shift</label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedShift(null);
                    resetFormData();
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: 'hsl(84 25% 30%)' }}
                >
                  {showCreateModal ? 'Create Shift' : 'Update Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}