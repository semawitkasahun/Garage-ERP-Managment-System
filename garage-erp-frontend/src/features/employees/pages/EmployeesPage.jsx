import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, CalendarOff, UserPlus2, UserX, Plus, ArrowUpDown, AlertCircle, Building } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useEmployees, useEmployeeStats, useDeleteEmployee, useUpdateEmployee } from '@/features/employees/hooks/useEmployees';
import { AddEmployeeModal } from '@/features/employees/components/AddEmployeeModal';
import { EditEmployeeModal } from '@/features/employees/components/EditEmployeeModal';
import { FilterBar } from '@/components/employees/FilterBar';
import { ActionMenu } from '@/components/employees/ActionMenu';
import { EmployeeDetailsModal } from '@/components/employees/EmployeeDetailsModal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const STATUS_META = {
  active: { bg: 'hsl(84 20% 89%)', text: 'hsl(84 25% 25%)' },
  inactive: { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)' },
  on_leave: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  terminated: { bg: 'hsl(0 30% 95%)', text: 'hsl(0 40% 40%)' },
};

const SORTABLE_FIELDS = [
  { key: 'first_name', label: 'Name' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'employment_status', label: 'Status' },
  { key: 'hire_date', label: 'Hire Date' },
];

export function EmployeesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    job_title: '',
    employment_status: '',
    hire_date_from: '',
    hire_date_to: '',
  });
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [sort, setSort] = useState({ field: 'hire_date', direction: 'desc' });

  // Delete & Status Toggle Confirm Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [employeeToToggle, setEmployeeToToggle] = useState(null);

  const { data: stats, isLoading: statsLoading } = useEmployeeStats(user?.branch_id);
  const { data: employeesData, isLoading, error } = useEmployees({ 
    ...filters, 
    page, 
    sort_by: sort.field, 
    sort_direction: sort.direction 
  });
  const deleteEmployee = useDeleteEmployee();
  const updateEmployee = useUpdateEmployee();

  const employees = employeesData?.data ?? [];
  const totalEmployees = stats?.total_employees ?? 0;
  const activeEmployees = stats?.active_employees ?? 0;
  const onLeaveToday = stats?.on_leave_today ?? 0;
  const newHiresThisMonth = stats?.new_hires_this_month ?? 0;
  const inactiveEmployees = stats?.inactive_employees ?? 0;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleSort = (field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      department: '',
      job_title: '',
      employment_status: '',
      hire_date_from: '',
      hire_date_to: '',
    });
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleDeleteClick = (emp) => {
    setEmployeeToDelete(emp);
    setDeleteConfirmOpen(true);
  };

  async function handleDeleteConfirm() {
    if (!employeeToDelete) return;
    try {
      await deleteEmployee.mutateAsync(employeeToDelete.employee_id);
      toast.success(`${employeeToDelete.first_name} ${employeeToDelete.last_name} deleted successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not delete employee.');
    } finally {
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  }

  const handleToggleStatusClick = (emp) => {
    setEmployeeToToggle(emp);
    setStatusConfirmOpen(true);
  };

  async function handleToggleStatusConfirm() {
    if (!employeeToToggle) return;
    const newStatus = employeeToToggle.employment_status === 'active' ? 'inactive' : 'active';
    try {
      await updateEmployee.mutateAsync({ 
        employeeId: employeeToToggle.employee_id, 
        payload: { employment_status: newStatus } 
      });
      toast.success(`Employee status set to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update employee status.');
    } finally {
      setStatusConfirmOpen(false);
      setEmployeeToToggle(null);
    }
  }

  const handleViewDetails = (emp) => {
    setSelectedEmployeeId(emp.employee_id);
    setDetailsModalOpen(true);
  };

  const handleEdit = (emp) => {
    setEditingEmployee(emp);
    setEditModalOpen(true);
  };

  const handleManageAccount = (emp) => {
    // Account access is managed in Users & Roles page
    navigate('/admin/dashboard');
    toast.info('Account login access is managed from the Users & Roles dashboard.');
  };

  const handleViewAttendance = (emp) => {
    navigate('/attendance', { state: { search: `${emp.first_name} ${emp.last_name}` } });
    toast.info(`Filtered attendance records for ${emp.first_name} ${emp.last_name}.`);
  };

  const handleViewLeave = (emp) => {
    navigate('/leave', { state: { search: `${emp.first_name} ${emp.last_name}` } });
    toast.info(`Filtered leave requests for ${emp.first_name} ${emp.last_name}.`);
  };

  const handleViewPayroll = (emp) => {
    navigate(`/payroll/employee/${emp.employee_id}`);
  };

  const handleViewPerformance = (emp) => {
    // Performance details are summarized inside the Details modal
    setSelectedEmployeeId(emp.employee_id);
    setDetailsModalOpen(true);
    toast.info(`Performance overview for ${emp.first_name} is displayed in the details window.`);
  };

  const navSections = getNavSections(user?.role);

  return (
    <DashboardLayout navSections={navSections} pageTitle="Employees" roleLabel={user?.username ?? 'Staff'}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {statsLoading ? (
          // Loading Skeletons
          [...Array(5)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Total Employees</span>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{totalEmployees}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Active Employees</span>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-display text-2xl font-semibold tracking-tight">{activeEmployees}</p>
                {activeEmployees > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full" style={{ background: 'hsl(145 35% 93%)' }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: 'hsl(145 45% 30%)' }} />
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">On Leave Today</span>
                <CalendarOff className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{onLeaveToday}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">New Hires This Month</span>
                <UserPlus2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{newHiresThisMonth}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">Inactive Employees</span>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-display text-2xl font-semibold tracking-tight">{inactiveEmployees}</p>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <FilterBar 
        filters={filters} 
        onFiltersChange={handleFilterChange} 
        onClearFilters={handleClearFilters}
      />

      {/* Add Employee Button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setModalOpen(true)} 
          className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" 
          style={{ background: 'hsl(84 25% 30%)' }}
        >
          <Plus className="h-4 w-4" /> Add employee
        </button>
      </div>

      {/* Employee Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/30 text-left">
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">ID</th>
                <th 
                  className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center gap-1">
                    Employee
                    {sort.field === 'first_name' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('job_title')}
                >
                  <div className="flex items-center gap-1">
                    Job Title
                    {sort.field === 'job_title' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Department</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Phone</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Basic Salary</th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Email</th>
                <th 
                  className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('hire_date')}
                >
                  <div className="flex items-center gap-1">
                    Hire Date
                    {sort.field === 'hire_date' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Login Access</th>
                <th 
                  className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('employment_status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sort.field === 'employment_status' && <ArrowUpDown className="h-3 w-3" />}
                  </div>
                </th>
                <th className="px-4 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading Skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                  </tr>
                ))
              ) : error ? (
                // Error State
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="h-8 w-8 text-destructive" />
                      <p className="text-muted-foreground">Failed to load employees. Please try again.</p>
                    </div>
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No employees found</p>
                      <p className="text-sm text-muted-foreground">Try adjusting your filters or add a new employee</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Employee Rows
                employees.map((emp) => {
                  const statusMeta = STATUS_META[emp.employment_status] ?? STATUS_META.active;
                  return (
                    <tr key={emp.employee_id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{emp.employee_id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs font-semibold" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                              {getInitials(emp.first_name, emp.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium text-foreground">{emp.first_name} {emp.last_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.job_title || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.branch?.name || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.phone || '—'}</td>
                      <td className="px-4 py-3 font-medium">
                        {emp.current_salary_structure ? (
                          `ETB ${Number(emp.current_salary_structure.basic_salary_override || emp.current_salary_structure.salary_structure?.basic_salary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-amber-600 text-xs font-normal">Not configured</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.email || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{emp.hire_date || '—'}</td>
                      <td className="px-4 py-3">
                        {emp.user ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 25% 25%)' }}>
                            Yes
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: statusMeta.bg, color: statusMeta.text }}>
                          {emp.employment_status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ActionMenu 
                          employee={emp}
                          onViewDetails={handleViewDetails}
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                          onManageAccount={handleManageAccount}
                          onViewAttendance={handleViewAttendance}
                          onViewLeave={handleViewLeave}
                          onViewPayroll={handleViewPayroll}
                          onViewPerformance={handleViewPerformance}
                          onToggleStatus={handleToggleStatusClick}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {employeesData && employeesData.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage((p) => p - 1)} 
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {employeesData.current_page} of {employeesData.last_page}
          </span>
          <button 
            disabled={page >= employeesData.last_page} 
            onClick={() => setPage((p) => p + 1)} 
            className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40 hover:bg-accent transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Edit Employee Modal */}
      <EditEmployeeModal 
        open={editModalOpen} 
        onClose={() => {
          setEditModalOpen(false);
          setEditingEmployee(null);
        }} 
        employee={editingEmployee} 
      />

      {/* Employee Details Modal */}
      <EmployeeDetailsModal 
        employeeId={selectedEmployeeId} 
        open={detailsModalOpen} 
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedEmployeeId(null);
        }} 
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee"
        message={`Are you sure you want to remove ${employeeToDelete?.first_name} ${employeeToDelete?.last_name}? This action is permanent.`}
        confirmText="Delete"
        confirmStyle="danger"
        loading={deleteEmployee.isPending}
      />

      {/* Status Change Confirmation */}
      <ConfirmDialog
        open={statusConfirmOpen}
        onClose={() => setStatusConfirmOpen(false)}
        onConfirm={handleToggleStatusConfirm}
        title="Change Employment Status"
        message={`Are you sure you want to toggle the status of ${employeeToToggle?.first_name} ${employeeToToggle?.last_name}?`}
        confirmText="Toggle"
        loading={updateEmployee.isPending}
      />
    </DashboardLayout>
  );
}
