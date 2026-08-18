import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Search, Filter, ChevronDown, FileText, Eye, Trash2, CalendarDays, X } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLeaveRequests, useLeaveStats, usePendingLeave, useApproveLeave, useRejectLeave, useDeleteLeave } from '@/features/leave/hooks/useLeave';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Personal Leave',
  'Unpaid Leave',
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  approved: { label: 'Approved', bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-800' },
  'in_progress': { label: 'In Progress', bg: 'bg-blue-100', text: 'text-blue-800' },
  completed: { label: 'Completed', bg: 'bg-purple-100', text: 'text-purple-800' },
};

export function LeaveDashboard() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const initialSearch = location.state?.search || searchParams.get('search') || '';

  const [filters, setFilters] = useState({
    search: initialSearch,
    status: '',
    leave_type: '',
    from_date: '',
    to_date: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const { data: leaveRequests, isLoading, error } = useLeaveRequests(filters);
  const { data: stats, isLoading: statsLoading } = useLeaveStats({ branch_id: user?.branch_id });
  const { data: pendingLeave } = usePendingLeave();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();
  const deleteLeave = useDeleteLeave();

  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'Annual Leave',
    start_date: '',
    end_date: '',
    reason: '',
    attachment: '',
  });

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    setFilters({ search: '', status: '', leave_type: '', from_date: '', to_date: '' });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== null && v !== undefined);

  const handleApprove = (leaveId) => {
    if (!confirm('Approve this leave request?')) return;
    approveLeave.mutate({ leaveId, approvedBy: user?.id });
  };

  const handleReject = (leaveId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    rejectLeave.mutate({ leaveId, rejectionReason: reason });
  };

  const handleDelete = (leaveId) => {
    if (!confirm('Delete this leave request?')) return;
    deleteLeave.mutate(leaveId);
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  const navSections = getNavSections(user?.role);

  return (
    <DashboardLayout navSections={navSections} pageTitle="Leave Management" roleLabel={user?.username ?? 'Staff'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee leave requests and approvals</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
          style={{ background: 'hsl(84 25% 30%)' }}
        >
          <Plus className="h-4 w-4" /> New Leave Request
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mb-6">
        {statsLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Total Employees</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{stats?.total_employees || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">On Leave Today</span>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(200 50% 32%)' }}>{stats?.on_leave_today || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Pending Requests</span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(45 70% 40%)' }}>{stats?.pending_requests || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Approved This Month</span>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(84 25% 25%)' }}>{stats?.approved_this_month || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Rejected This Month</span>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight" style={{ color: 'hsl(0 40% 40%)' }}>{stats?.rejected_this_month || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Upcoming Leave</span>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{stats?.upcoming_leave || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by employee name..."
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Statuses</option>
                  {Object.keys(STATUS_CONFIG).map((status) => (
                    <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Leave Type</label>
                <select
                  value={filters.leave_type || ''}
                  onChange={(e) => handleFilterChange('leave_type', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Types</option>
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">From Date</label>
                <input
                  type="date"
                  value={filters.from_date || ''}
                  onChange={(e) => handleFilterChange('from_date', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">To Date</label>
                <input
                  type="date"
                  value={filters.to_date || ''}
                  onChange={(e) => handleFilterChange('to_date', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border bg-accent/30">
          <h2 className="font-display text-sm font-semibold tracking-tight">Leave Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-left">
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Employee</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Leave Type</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Start Date</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">End Date</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Days</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Reason</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <p className="text-muted-foreground">Failed to load leave requests. Please try again.</p>
                    </div>
                  </td>
                </tr>
              ) : leaveRequests && leaveRequests.length > 0 ? (
                leaveRequests.map((leave) => {
                  const statusConfig = STATUS_CONFIG[leave.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={leave.leave_id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-semibold" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                              {getInitials(leave.employee?.first_name, leave.employee?.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">{leave.employee?.first_name} {leave.employee?.last_name}</span>
                            <p className="text-xs text-muted-foreground">{leave.employee?.job_title || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{leave.leave_type || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(leave.start_date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(leave.end_date)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{leave.days || calculateDays(leave.start_date, leave.end_date)}</td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">{leave.reason || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {/* View details */}}
                            className="p-1.5 rounded-md border border-border hover:bg-accent transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {leave.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(leave.leave_id)}
                                className="p-1.5 rounded-md border border-border hover:bg-green-50 text-green-600 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleReject(leave.leave_id)}
                                className="p-1.5 rounded-md border border-border hover:bg-red-50 text-red-600 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                          {leave.status !== 'approved' && (
                            <button
                              onClick={() => handleDelete(leave.leave_id)}
                              className="p-1.5 rounded-md border border-border hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No leave requests found</p>
                      <p className="text-sm text-muted-foreground">Create a new leave request to get started</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Leave Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-display text-lg font-semibold tracking-tight">New Leave Request</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Leave Type</label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                >
                  {LEAVE_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reason</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ background: 'hsl(84 25% 30%)' }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}