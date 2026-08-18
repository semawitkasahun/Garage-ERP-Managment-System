import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DollarSign, Calendar, Users, CheckCircle, Clock, AlertCircle, Plus, 
  FileText, Download, Eye, CreditCard, TrendingUp, Building2, Settings,
  Search, Filter, MoreVertical, ChevronRight, ArrowRight, Calculator,
  UserCheck, Trash2, Edit2, ChevronLeft, X, BarChart2, History as HistoryIcon, Printer, FileSpreadsheet
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { 
  usePayrollPeriods, usePayrollRuns, usePayrollItems, 
  useCreatePayrollPeriod, useProcessPayrollPeriod, usePayrollDashboardMetrics,
  useApprovePayrollPeriod, useMarkPayrollPeriodAsPaid, useProcessPayrollRun, useApprovePayrollRun,
  useGenerateBulkPayslips, useImportAttendance,
  useCalculateSalaries, useCalculateDeductions, useReviewPayroll, useProcessPayment,
  useEmployeePayrollProfiles, usePayrollPeriodMonthStats,
  useDeletePayrollPeriod, useUpdatePayrollPeriod, useEmployeePayrollList,
  useComprehensivePayrollReport
} from '@/features/payroll/hooks/usePayroll';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreatePeriodModal } from '@/features/payroll/components/CreatePeriodModal';
import { ConfigurePayrollModal } from '@/features/payroll/components/ConfigurePayrollModal';

const STATUS_STYLES = {
  draft: { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)' },
  processing: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  pending_approval: { bg: 'hsl(30 50% 90%)', text: 'hsl(30 50% 35%)' },
  approved: { bg: 'hsl(145 35% 93%)', text: 'hsl(145 45% 30%)' },
  paid: { bg: 'hsl(200 35% 93%)', text: 'hsl(200 45% 30%)' },
  closed: { bg: 'hsl(220 30% 90%)', text: 'hsl(220 30% 35%)' },
  cancelled: { bg: 'hsl(0 30% 95%)', text: 'hsl(0 40% 40%)' },
};

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'periods', label: 'Payroll Periods', icon: Calendar },
  { id: 'employees', label: 'Employee Payroll', icon: Users },
  { id: 'payments', label: 'Payment History', icon: CreditCard },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
];

export function PayrollPage({ defaultSection }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [activeSection, setActiveSection] = useState(defaultSection || 'dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedEmpForConfig, setSelectedEmpForConfig] = useState(null);
  // Payroll Periods tab state
  const [periodsFilterStatus, setPeriodsFilterStatus] = useState('all');
  const [periodsFilterMonth, setPeriodsFilterMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });
  const [deletingPeriodId, setDeletingPeriodId] = useState(null);
  const [editingPeriod, setEditingPeriod] = useState(null);
  // Employee Payroll tab state
  const [selectedEmpPeriodId, setSelectedEmpPeriodId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const periodParam = params.get('period');
    return periodParam ? Number(periodParam) : null;
  });
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [empStatusFilter, setEmpStatusFilter] = useState('all');

  // Payroll Reports tab state
  const [reportTab, setReportTab] = useState('summary'); // 'summary' | 'employee' | 'deduction' | 'payment' | 'period'
  const [rptPeriodId, setRptPeriodId] = useState('all');
  const [rptMonth, setRptMonth] = useState('');
  const [rptYear, setRptYear] = useState('');
  const [rptDepartmentId, setRptDepartmentId] = useState('all');
  const [rptJobTitle, setRptJobTitle] = useState('all');
  const [rptStatus, setRptStatus] = useState('all');

  const { data: dashboardMetrics, isLoading: metricsLoading } = usePayrollDashboardMetrics();
  const { data: periodsData, isLoading: periodsLoading } = usePayrollPeriods({ page });
  const { data: runsData, isLoading: runsLoading } = usePayrollRuns({ page });
  const { data: itemsData, isLoading: itemsLoading } = usePayrollItems({ page });
  const { data: employeePayrollProfilesData, isLoading: employeePayrollProfilesLoading } = useEmployeePayrollProfiles({ branch_id: user?.branch_id, page });
  const [monthYear] = periodsFilterMonth.split('-').map(Number);
  const { data: monthStats, isLoading: monthStatsLoading } = usePayrollPeriodMonthStats({
    month: monthYear,
    year: periodsFilterMonth.split('-')[0],
    branch_id: user?.branch_id,
  });

  const periodsList = periodsData?.data ?? [];
  const activeEmpPeriodId = selectedEmpPeriodId || (periodsList.length > 0 ? periodsList[0].payroll_period_id : null);

  const { data: employeePayrollListData, isLoading: empListLoading } = useEmployeePayrollList({
    payroll_period_id: activeEmpPeriodId,
    search: empSearchQuery,
    branch_id: user?.branch_id,
  });

  const { data: comprehensiveReportData, isLoading: reportLoading } = useComprehensivePayrollReport({
    payroll_period_id: rptPeriodId,
    month: rptMonth,
    year: rptYear,
    department_id: rptDepartmentId,
    job_title: rptJobTitle,
    status: rptStatus,
  });

  const createPayrollPeriod = useCreatePayrollPeriod();
  const processPayrollPeriod = useProcessPayrollPeriod();
  const approvePayrollPeriod = useApprovePayrollPeriod();
  const markPayrollPeriodAsPaid = useMarkPayrollPeriodAsPaid();
  const processPayrollRun = useProcessPayrollRun();
  const approvePayrollRun = useApprovePayrollRun();
  const generateBulkPayslips = useGenerateBulkPayslips();
  const deletePayrollPeriod = useDeletePayrollPeriod();
  const updatePayrollPeriod = useUpdatePayrollPeriod();

  // Workflow hooks
  const importAttendance = useImportAttendance();
  const calculateSalaries = useCalculateSalaries();
  const calculateDeductions = useCalculateDeductions();
  const reviewPayroll = useReviewPayroll();
  const processPayment = useProcessPayment();

  const periods = periodsData?.data ?? [];
  const runs = runsData?.data ?? [];
  const items = itemsData?.data ?? [];
  const employeePayrollProfiles = employeePayrollProfilesData?.data ?? [];

  const handleCreatePeriod = () => {
    setCreateModalOpen(true);
  };

  const handleCreatePeriodSubmit = async (data) => {
    try {
      await createPayrollPeriod.mutateAsync({
        name: data.name,
        start_date: data.start_date,
        end_date: data.end_date,
        branch_id: user?.branch_id,
      });
      toast.success('Payroll period created successfully.');
      setCreateModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not create payroll period');
    }
  };

  const handleProcessPeriod = async (periodId) => {
    try {
      await processPayrollPeriod.mutateAsync(periodId);
      toast.success('Payroll period processing started.');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requires_setup) {
        toast.warning(
          `${errorData.message}. Please configure payroll for employees needing setup in the Employee Payroll section.`
        );
      } else {
        toast.error(errorData?.message ?? 'Could not process payroll period');
      }
    }
  };

  const handleApprovePeriod = async (periodId) => {
    try {
      await approvePayrollPeriod.mutateAsync(periodId);
      toast.success('Payroll period approved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not approve payroll period');
    }
  };

  const handleMarkAsPaid = async (periodId) => {
    try {
      await markPayrollPeriodAsPaid.mutateAsync(periodId);
      toast.success('Payroll period marked as paid.');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not mark payroll as paid');
    }
  };

  const handleProcessPayroll = async () => {
    try {
      const draftPeriods = periods.filter(p => p.status === 'draft');
      for (const period of draftPeriods) {
        await processPayrollPeriod.mutateAsync(period.payroll_period_id);
      }
      toast.success('Payroll processing initiated for all draft periods');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requires_setup) {
        toast.warning(
          `${errorData.message}. Please configure employee salaries in the Employee Payroll section.`
        );
      } else {
        toast.error(errorData?.message ?? 'Could not process payroll');
      }
    }
  };

  const handleGeneratePayslips = async () => {
    try {
      const approvedPeriods = periods.filter(p => p.status === 'approved' || p.status === 'paid');
      if (approvedPeriods.length === 0) {
        toast.error('No approved payroll periods to generate payslips for');
        return;
      }
      
      await generateBulkPayslips.mutateAsync(approvedPeriods[0].payroll_period_id);
      toast.success('Payslips generated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not generate payslips');
    }
  };

  const handleImportAttendance = async (periodId) => {
    try {
      await importAttendance.mutateAsync(periodId);
      toast.success('Attendance imported successfully');
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not import attendance');
    }
  };

  const handleCalculateSalaries = async (periodId) => {
    toast.warning('Bulk calculation is disabled. Salary calculations must be processed per-employee to account for attendance.');
  };

  const handleCalculateDeductions = async (periodId) => {
    toast.warning('Bulk deduction calculation is disabled. Deductions must be processed per-employee to account for attendance.');
  };

  const handleReviewPayroll = async (periodId) => {
    toast.warning('Bulk review is disabled. Please review payroll records per-employee on their individual detail page.');
  };

  const handleProcessPayment = async (periodId) => {
    toast.warning('Bulk payments are disabled. All payment actions must be processed individually per-employee.');
  };

  const navSections = getNavSections(user?.role);

  useEffect(() => {
    if (defaultSection === 'payments') {
      navigate('/payroll-history', { replace: true });
      return;
    }
    if (defaultSection) {
      setActiveSection(defaultSection);
    }
  }, [defaultSection, location.pathname, navigate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Payroll Management" roleLabel={user?.username ?? 'Staff'}>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => {
                if (section.id === 'payments') {
                  navigate('/payroll-history');
                } else if (section.id === 'reports') {
                  navigate('/payroll-reports');
                } else {
                  setActiveSection(section.id);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === section.id
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Dashboard Section */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Payroll Overview</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {dashboardMetrics?.current_payroll_period
                  ? `Current period: ${dashboardMetrics.current_payroll_period.name}`
                  : 'No active payroll period'}
              </p>
            </div>
            <button
              onClick={handleCreatePeriod}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm"
              style={{ background: 'hsl(84 25% 30%)' }}
              disabled={createPayrollPeriod.isLoading}
            >
              <Plus className="h-4 w-4" />
              {createPayrollPeriod.isLoading ? 'Creating…' : 'New Period'}
            </button>
          </div>

          {/* Simplified KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Active Employees */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(84 20% 91%)' }}>
                  <Users className="h-4 w-4" style={{ color: 'hsl(84 30% 28%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Employees</span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-12 inline-block" /> : dashboardMetrics?.total_employees ?? 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Active</p>
            </div>

            {/* Current Payroll Period */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(42 40% 92%)' }}>
                  <Calendar className="h-4 w-4" style={{ color: 'hsl(42 50% 32%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Period</span>
              </div>
              <p className="font-display text-lg font-semibold tracking-tight">
                {metricsLoading ? <Skeleton className="h-6 w-24 inline-block" /> : dashboardMetrics?.current_payroll_period?.name || 'No active period'}
              </p>
              {dashboardMetrics?.current_payroll_period && (
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardMetrics.current_payroll_period.start_date} - {dashboardMetrics.current_payroll_period.end_date}
                </p>
              )}
            </div>

            {/* Gross Payroll */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(200 40% 92%)' }}>
                  <DollarSign className="h-4 w-4" style={{ color: 'hsl(200 50% 30%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Gross</span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-20 inline-block" /> : formatCurrency(dashboardMetrics?.gross_payroll || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Gross Payroll</p>
            </div>

            {/* Total Deductions */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(30 40% 92%)' }}>
                  <TrendingUp className="h-4 w-4" style={{ color: 'hsl(30 50% 35%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Deductions</span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-20 inline-block" /> : formatCurrency(dashboardMetrics?.total_deductions || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Total Deductions</p>
            </div>

            {/* Net Payroll */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(220 40% 92%)' }}>
                  <CreditCard className="h-4 w-4" style={{ color: 'hsl(220 50% 35%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Net</span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-20 inline-block" /> : formatCurrency(dashboardMetrics?.net_payroll || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Net Payroll</p>
            </div>

            {/* Employees Pending Payment */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(30 40% 92%)' }}>
                  <Clock className="h-4 w-4" style={{ color: 'hsl(30 50% 35%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Pending</span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-12 inline-block" /> : dashboardMetrics?.pending_approval || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Employees Pending Payment</p>
            </div>

            {/* Employees Paid */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: 'hsl(145 40% 92%)' }}>
                  <CheckCircle className="h-4 w-4" style={{ color: 'hsl(145 50% 30%)' }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">Paid</span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {metricsLoading ? <Skeleton className="h-8 w-12 inline-block" /> : dashboardMetrics?.paid_employees || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Employees Paid</p>
            </div>

            {/* Reports Button */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-center">
              <button
                onClick={() => setActiveSection('periods')}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-accent/30 transition-colors"
              >
                <BarChart2 className="h-4 w-4" /> View Reports
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-display text-lg font-semibold mb-4">Recent Payroll Activity</h3>
            {periodsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : periods.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
                <p className="text-muted-foreground">No payroll periods found</p>
                <p className="text-sm text-muted-foreground">Create a new payroll period to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {periods.slice(0, 5).map((period) => {
                  const statusStyle = STATUS_STYLES[period.status] || STATUS_STYLES.draft;
                  return (
                    <div key={period.payroll_period_id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{period.name}</p>
                          <p className="text-xs text-muted-foreground">{period.start_date} - {period.end_date}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {period.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
           PAYROLL PERIODS SECTION
      ══════════════════════════════════════════════════════════ */}
      {activeSection === 'periods' && (() => {
        // Filter periods locally by month and status
        const filteredPeriods = periods.filter((p) => {
          const monthMatch = periodsFilterMonth === 'all' ||
            p.start_date?.startsWith(periodsFilterMonth) ||
            p.end_date?.startsWith(periodsFilterMonth);
          const statusMatch = periodsFilterStatus === 'all' || p.status === periodsFilterStatus;
          return monthMatch && statusMatch;
        });

        const canDelete = (p) => !['approved', 'paid'].includes(p.status);
        const canEdit   = (p) => !['approved', 'paid', 'closed', 'cancelled'].includes(p.status);

        const handleDeletePeriod = async (periodId) => {
          try {
            await deletePayrollPeriod.mutateAsync(periodId);
            toast.success('Payroll period deleted.');
          } catch (err) {
            toast.error(err.response?.data?.message ?? 'Could not delete period.');
          } finally {
            setDeletingPeriodId(null);
          }
        };

        // Month navigation
        const navigateMonth = (dir) => {
          const [y, m] = periodsFilterMonth.split('-').map(Number);
          const d = new Date(y, m - 1 + dir, 1);
          setPeriodsFilterMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        };
        const currentMonthLabel = (() => {
          const [y, m] = periodsFilterMonth.split('-').map(Number);
          return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        })();

        return (
          <div className="space-y-5">
            {/* Page header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">Payroll Periods</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Define date ranges for each pay cycle</p>
              </div>
              <button
                onClick={handleCreatePeriod}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm"
                style={{ background: 'hsl(84 25% 30%)' }}
                disabled={createPayrollPeriod.isLoading}
              >
                <Plus className="h-4 w-4" />
                {createPayrollPeriod.isLoading ? 'Creating…' : 'Create Payroll Period'}
              </button>
            </div>

            {/* Month navigator + summary cards */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-accent/10">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{currentMonthLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigateMonth(-1)} className="p-1.5 rounded-md hover:bg-accent/40 transition-colors text-muted-foreground">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      const n = new Date();
                      setPeriodsFilterMonth(`${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`);
                    }}
                    className="px-2.5 py-1 text-xs font-medium rounded-md hover:bg-accent/40 transition-colors"
                  >
                    Today
                  </button>
                  <button onClick={() => navigateMonth(1)} className="p-1.5 rounded-md hover:bg-accent/40 transition-colors text-muted-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 divide-x divide-border">
                {[
                  { label: 'Periods', value: monthStats?.total_periods ?? 0, sub: `of ${monthStats?.max_allowed ?? 4} max`, accent: false },
                  { label: 'Remaining', value: monthStats?.remaining_slots ?? 4, sub: 'slots available', accent: false },
                  { label: 'Open', value: monthStats?.open_periods ?? 0, sub: 'draft + processing', accent: false },
                  { label: 'Processing', value: monthStats?.processing_periods ?? 0, sub: 'in workflow', accent: false },
                  { label: 'Pending', value: monthStats?.pending_approval ?? 0, sub: 'awaiting approval', accent: monthStats?.pending_approval > 0 },
                  { label: 'Completed', value: monthStats?.completed_periods ?? 0, sub: 'approved + paid', accent: false },
                ].map(({ label, value, sub, accent }) => (
                  <div key={label} className={`px-4 py-3.5 ${accent ? 'bg-amber-50' : ''}`}>
                    <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{label}</p>
                    <p className={`font-display text-xl font-bold ${accent ? 'text-amber-700' : ''}`}>
                      {monthStatsLoading ? <Skeleton className="h-6 w-8 inline-block" /> : value}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Quota bar */}
              {!monthStatsLoading && monthStats && (
                <div className="px-5 py-2.5 border-t border-border bg-accent/5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Period slots used</span>
                    <span className="font-mono">{monthStats.total_periods} / {monthStats.max_allowed}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (monthStats.total_periods / monthStats.max_allowed) * 100)}%`,
                        background: monthStats.total_periods >= 4 ? 'hsl(0 50% 55%)' : monthStats.total_periods >= 3 ? 'hsl(30 70% 50%)' : 'hsl(84 30% 45%)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-card text-sm">
                {['all', 'draft', 'processing', 'pending_approval', 'approved', 'paid'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPeriodsFilterStatus(s)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                      periodsFilterStatus === s
                        ? 'text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                    style={periodsFilterStatus === s ? { background: 'hsl(84 25% 30%)' } : {}}
                  >
                    {s === 'all' ? 'All Statuses' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              {(periodsFilterStatus !== 'all') && (
                <button onClick={() => setPeriodsFilterStatus('all')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" /> Clear filter
                </button>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredPeriods.length} period{filteredPeriods.length !== 1 ? 's' : ''} shown
              </span>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/20 text-left">
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">ID</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Period Name</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Start Date</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">End Date</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Employees</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Gross</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Net</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Status</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodsLoading ? (
                      [...Array(4)].map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {[...Array(9)].map((__, j) => (
                            <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-16" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredPeriods.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-14 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Calendar className="h-10 w-10 text-muted-foreground opacity-40" />
                            <p className="text-sm font-medium text-muted-foreground">
                              {periodsFilterStatus !== 'all'
                                ? `No "${periodsFilterStatus.replace('_', ' ')}" periods in ${currentMonthLabel}`
                                : `No payroll periods for ${currentMonthLabel}`}
                            </p>
                            <button
                              onClick={handleCreatePeriod}
                              className="mt-1 text-xs font-medium hover:underline"
                              style={{ color: 'hsl(84 28% 30%)' }}
                            >
                              + Create a new payroll period
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredPeriods.map((period) => {
                        const statusStyle = STATUS_STYLES[period.status] || STATUS_STYLES.draft;
                        // Employee count / gross / net come from period items
                        const empCount = period.employee_count ?? (period.payrollRuns?.reduce((s, r) => s + (r.items?.length ?? 0), 0) ?? '—');
                        const gross = period.gross_payroll ?? period.payrollRuns?.reduce((s, r) => s + (r.total_gross_pay ?? 0), 0);
                        const net   = period.net_payroll   ?? period.payrollRuns?.reduce((s, r) => s + (r.total_net_pay   ?? 0), 0);

                        return (
                          <tr
                            key={period.payroll_period_id}
                            className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors group"
                          >
                            <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                              #{period.payroll_period_id}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-medium">{period.name}</span>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground tabular-nums text-xs">
                              {period.start_date}
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground tabular-nums text-xs">
                              {period.end_date}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums">
                              {typeof empCount === 'number' ? empCount : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-xs">
                              {gross != null && gross > 0 ? formatCurrency(gross) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-xs font-medium">
                              {net != null && net > 0 ? formatCurrency(net) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                                style={{ background: statusStyle.bg, color: statusStyle.text }}
                              >
                                {period.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Primary workflow action */}
                                {period.status === 'draft' && (
                                  <button
                                    onClick={() => handleImportAttendance(period.payroll_period_id)}
                                    className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 border border-border hover:bg-accent/40 transition-colors"
                                    title="Import Attendance"
                                  >
                                    <UserCheck className="h-3 w-3" /> Attendance
                                  </button>
                                )}
                                {period.status === 'pending_approval' && (
                                  <button
                                    onClick={() => handleApprovePeriod(period.payroll_period_id)}
                                    className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 text-white transition-colors hover:opacity-90"
                                    style={{ background: 'hsl(145 40% 35%)' }}
                                    disabled={approvePayrollPeriod.isLoading}
                                    title="Approve Period"
                                  >
                                    <CheckCircle className="h-3 w-3" /> Approve
                                  </button>
                                )}
                                {period.status === 'approved' && (
                                  <button
                                    onClick={() => { setSelectedPeriod(period); setActiveSection('employees'); }}
                                    className="flex items-center gap-1 text-xs font-medium rounded-md px-2.5 py-1 border border-border hover:bg-accent/40 transition-colors"
                                    title="View Employees"
                                  >
                                    <Users className="h-3 w-3" /> Employees
                                  </button>
                                )}

                                {/* View detail */}
                                <button
                                  onClick={() => { setSelectedPeriod(period); setActiveSection('employees'); }}
                                  className="p-1.5 rounded-md border border-border hover:bg-accent/40 transition-colors text-muted-foreground"
                                  title="View employees for this period"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>

                                {/* Edit */}
                                {canEdit(period) && (
                                  <button
                                    onClick={() => setEditingPeriod(period)}
                                    className="p-1.5 rounded-md border border-border hover:bg-accent/40 transition-colors text-muted-foreground"
                                    title="Edit period"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {/* Delete */}
                                {canDelete(period) && (
                                  <button
                                    onClick={() => setDeletingPeriodId(period.payroll_period_id)}
                                    className="p-1.5 rounded-md border border-border hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors text-muted-foreground"
                                    title="Delete period"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {periodsData?.last_page > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Page {periodsData.current_page} of {periodsData.last_page}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent/30 disabled:opacity-40 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= periodsData.last_page}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-accent/30 disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inline Edit Modal */}
            {editingPeriod && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-xl bg-white border border-border shadow-2xl">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg" style={{ background: 'hsl(84 20% 91%)' }}>
                        <Edit2 className="h-4 w-4" style={{ color: 'hsl(84 30% 28%)' }} />
                      </div>
                      <h2 className="font-display text-base font-semibold">Edit Period</h2>
                    </div>
                    <button onClick={() => setEditingPeriod(null)} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <form
                    className="p-6 space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.target);
                      try {
                        await updatePayrollPeriod.mutateAsync({
                          id: editingPeriod.payroll_period_id,
                          data: {
                            name:       fd.get('name'),
                            start_date: fd.get('start_date'),
                            end_date:   fd.get('end_date'),
                          },
                        });
                        toast.success('Period updated successfully.');
                        setEditingPeriod(null);
                      } catch (err) {
                        toast.error(err.response?.data?.message ?? 'Could not update period.');
                      }
                    }}
                  >
                    <div>
                      <label className="block text-xs font-medium mb-1.5">Period Name</label>
                      <input name="name" defaultValue={editingPeriod.name} required
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5">Start Date</label>
                        <input name="start_date" type="date" defaultValue={editingPeriod.start_date} required
                          className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5">End Date</label>
                        <input name="end_date" type="date" defaultValue={editingPeriod.end_date} required
                          className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-1 border-t border-border">
                      <button type="button" onClick={() => setEditingPeriod(null)}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent/30">
                        Cancel
                      </button>
                      <button type="submit" disabled={updatePayrollPeriod.isLoading}
                        className="px-5 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 flex items-center gap-2 disabled:opacity-50"
                        style={{ background: 'hsl(84 25% 30%)' }}>
                        {updatePayrollPeriod.isLoading && <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Delete Confirm */}
            {deletingPeriodId && (
              <ConfirmDialog
                open={!!deletingPeriodId}
                title="Delete Payroll Period"
                description="Are you sure you want to delete this payroll period? This action cannot be undone."
                confirmLabel="Delete"
                onConfirm={() => handleDeletePeriod(deletingPeriodId)}
                onCancel={() => setDeletingPeriodId(null)}
                loading={deletePayrollPeriod.isLoading}
                destructive
              />
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════
           EMPLOYEE PAYROLL SECTION
      ══════════════════════════════════════════════════════════ */}
      {activeSection === 'employees' && (() => {
        const empPeriods = periodsData?.data ?? [];
        const currentActivePeriod = empPeriods.find(p => p.payroll_period_id === activeEmpPeriodId) || empPeriods[0];
        const rawEmployees = employeePayrollListData?.data ?? [];

        // Calculate 6 summary card stats for current active period
        const totalEmp = rawEmployees.length;
        const notStartedEmp = rawEmployees.filter(e => !e.payroll_item || ['draft', 'pending'].includes(e.payroll_item?.status)).length;
        const calculatedEmp = rawEmployees.filter(e => e.payroll_item?.status === 'calculated').length;
        const pendingApprovalEmp = rawEmployees.filter(e => ['under_review', 'pending_approval'].includes(e.payroll_item?.status)).length;
        const approvedEmp = rawEmployees.filter(e => e.payroll_item?.status === 'approved').length;
        const paidEmp = rawEmployees.filter(e => e.payroll_item?.status === 'paid').length;

        // Filter employees list by status pill filter
        const filteredEmpList = rawEmployees.filter(e => {
          if (empStatusFilter === 'all') return true;
          const status = e.payroll_item?.status ?? 'not_started';
          if (empStatusFilter === 'not_started') return !e.payroll_item || ['draft', 'pending'].includes(status);
          if (empStatusFilter === 'calculated') return status === 'calculated';
          if (empStatusFilter === 'pending_approval') return ['under_review', 'pending_approval'].includes(status);
          if (empStatusFilter === 'approved') return status === 'approved';
          if (empStatusFilter === 'paid') return status === 'paid';
          return true;
        });

        const getStatusPill = (e) => {
          if (!e.payroll_profile) {
            return (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                <AlertCircle className="h-3 w-3 shrink-0 text-amber-600" /> Setup Required
              </span>
            );
          }
          const itemStatus = e.payroll_item?.status;
          if (!itemStatus || ['draft', 'pending'].includes(itemStatus)) {
            return (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                Not Started
              </span>
            );
          }
          const statusMap = {
            calculated: { bg: 'hsl(84 20% 90%)', text: 'hsl(84 30% 28%)', label: 'Calculated' },
            under_review: { bg: 'hsl(200 40% 92%)', text: 'hsl(200 50% 30%)', label: 'Under Review' },
            pending_approval: { bg: 'hsl(30 50% 90%)', text: 'hsl(30 50% 35%)', label: 'Pending Approval' },
            approved: { bg: 'hsl(145 35% 93%)', text: 'hsl(145 45% 30%)', label: 'Approved' },
            paid: { bg: 'hsl(220 30% 92%)', text: 'hsl(220 40% 30%)', label: 'Paid' },
          };
          const cfg = statusMap[itemStatus] || { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)', label: itemStatus };
          return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ background: cfg.bg, color: cfg.text }}>
              {cfg.label}
            </span>
          );
        };

        return (
          <div className="space-y-6">
            {/* Header with Payroll Period Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">Employee Payroll</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Process employee salaries for the active period
                </p>
              </div>

              {/* Period Selector Dropdown & Info */}
              <div className="flex items-center gap-3 bg-accent/20 p-2.5 rounded-lg border border-border">
                <Calendar className="h-5 w-5 shrink-0" style={{ color: 'hsl(84 25% 30%)' }} />
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-medium">
                    Current Payroll Period
                  </label>
                  <select
                    value={activeEmpPeriodId || ''}
                    onChange={(e) => setSelectedEmpPeriodId(Number(e.target.value))}
                    className="bg-transparent font-medium text-sm outline-none cursor-pointer text-foreground pr-2"
                  >
                    {empPeriods.map((p) => (
                      <option key={p.payroll_period_id} value={p.payroll_period_id}>
                        {p.name} ({p.start_date} → {p.end_date})
                      </option>
                    ))}
                  </select>
                </div>
                {currentActivePeriod && (
                  <span className="ml-2 text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'hsl(84 20% 90%)', color: 'hsl(84 30% 28%)' }}>
                    {currentActivePeriod.start_date} – {currentActivePeriod.end_date}
                  </span>
                )}
              </div>
            </div>

            {/* 6 Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Total Active</p>
                <p className="font-display text-2xl font-bold">{empListLoading ? <Skeleton className="h-7 w-8" /> : totalEmp}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Eligible Employees</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Not Started</p>
                <p className="font-display text-2xl font-bold text-gray-600">{empListLoading ? <Skeleton className="h-7 w-8" /> : notStartedEmp}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Pending Calculation</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Calculated</p>
                <p className="font-display text-2xl font-bold" style={{ color: 'hsl(84 30% 30%)' }}>
                  {empListLoading ? <Skeleton className="h-7 w-8" /> : calculatedEmp}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Salary Calculated</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Pending Approval</p>
                <p className="font-display text-2xl font-bold text-amber-600">{empListLoading ? <Skeleton className="h-7 w-8" /> : pendingApprovalEmp}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Under Review</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Approved</p>
                <p className="font-display text-2xl font-bold text-emerald-600">{empListLoading ? <Skeleton className="h-7 w-8" /> : approvedEmp}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Ready for Payment</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 shadow-sm bg-accent/10">
                <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Paid</p>
                <p className="font-display text-2xl font-bold text-blue-600">{empListLoading ? <Skeleton className="h-7 w-8" /> : paidEmp}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Payslip Available</p>
              </div>
            </div>

            {/* Search & Status Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-lg border border-border bg-card">
                {[
                  { id: 'all', label: 'All Employees' },
                  { id: 'not_started', label: 'Not Started' },
                  { id: 'calculated', label: 'Calculated' },
                  { id: 'pending_approval', label: 'Pending Approval' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'paid', label: 'Paid' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setEmpStatusFilter(st.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      empStatusFilter === st.id
                        ? 'text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                    }`}
                    style={empStatusFilter === st.id ? { background: 'hsl(84 25% 30%)' } : {}}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by employee name or title..."
                  value={empSearchQuery}
                  onChange={(e) => setEmpSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
                />
                {empSearchQuery && (
                  <button onClick={() => setEmpSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Employee Payroll Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-accent/20 text-left">
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Employee</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Job Title</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Basic Salary</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Gross Salary</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Total Deductions</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Net Pay</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Status</th>
                      <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empListLoading ? (
                      [...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-border">
                          {[...Array(8)].map((__, j) => (
                            <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                          ))}
                        </tr>
                      ))
                    ) : filteredEmpList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-14 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Users className="h-10 w-10 text-muted-foreground opacity-40" />
                            <p className="text-sm font-medium text-muted-foreground">
                              {empSearchQuery || empStatusFilter !== 'all'
                                ? 'No employees matching search criteria'
                                : 'No active employees found in Employee Management'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredEmpList.map((emp) => {
                        const profile = emp.payroll_profile;
                        const item = emp.payroll_item;
                        const basicSal = item?.basic_salary ?? profile?.basic_salary;
                        const grossSal = item?.gross_salary;
                        const totalDed = item?.deductions;
                        const netPay   = item?.net_pay;

                        return (
                          <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                            {/* Employee Name & ID */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0" style={{ background: 'hsl(84 25% 30%)' }}>
                                  {emp.first_name?.[0] || emp.name?.[0] || 'E'}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{emp.name || `${emp.first_name} ${emp.last_name}`}</p>
                                  <p className="font-mono text-[11px] text-muted-foreground">EMP-{String(emp.id).padStart(3, '0')}</p>
                                </div>
                              </div>
                            </td>

                            {/* Job Title */}
                            <td className="px-5 py-3.5 text-muted-foreground text-xs font-medium">
                              {emp.job_title || emp.department?.name || 'Staff'}
                            </td>

                            {/* Basic Salary */}
                            <td className="px-5 py-3.5 text-right font-medium tabular-nums text-xs">
                              {basicSal != null ? formatCurrency(basicSal) : (
                                <span className="text-amber-600 font-normal">Not set</span>
                              )}
                            </td>

                            {/* Gross Salary */}
                            <td className="px-5 py-3.5 text-right font-medium tabular-nums text-xs">
                              {grossSal != null ? formatCurrency(grossSal) : <span className="text-muted-foreground">—</span>}
                            </td>

                            {/* Total Deductions */}
                            <td className="px-5 py-3.5 text-right font-medium tabular-nums text-xs text-amber-700">
                              {totalDed != null ? formatCurrency(totalDed) : <span className="text-muted-foreground">—</span>}
                            </td>

                            {/* Net Pay */}
                            <td className="px-5 py-3.5 text-right font-bold tabular-nums text-xs text-emerald-700">
                              {netPay != null ? formatCurrency(netPay) : <span className="text-muted-foreground">—</span>}
                            </td>

                            {/* Status Pill */}
                            <td className="px-5 py-3.5">
                              {getStatusPill(emp)}
                            </td>

                            {/* Action Button */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {!profile && (
                                  <button
                                    onClick={() => {
                                      setSelectedEmpForConfig(emp);
                                      setConfigModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-medium text-white rounded-md transition-colors hover:opacity-90 flex items-center gap-1"
                                    style={{ background: 'hsl(84 25% 30%)' }}
                                  >
                                    <Settings className="h-3 w-3" /> Setup
                                  </button>
                                )}
                                <button
                                  onClick={() => navigate(`/payroll/employee/${emp.id}?payroll_period_id=${activeEmpPeriodId}`)}
                                  className="px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors hover:opacity-90 flex items-center gap-1 shadow-sm"
                                  style={{ background: 'hsl(84 25% 30%)' }}
                                >
                                  <Eye className="h-3.5 w-3.5" /> View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Payslips Section */}
      {activeSection === 'payslips' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-lg font-semibold">Payslips</h3>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium border border-border hover:bg-accent/30">
                <Download className="h-4 w-4" /> Export All
              </button>
              <button 
                onClick={handleGeneratePayslips}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ background: 'hsl(84 25% 30%)' }}
                disabled={generateBulkPayslips.isLoading}
              >
                <FileText className="h-4 w-4" /> {generateBulkPayslips.isLoading ? 'Generating...' : 'Generate Payslips'}
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-3" />
              <p className="text-muted-foreground">Generate payslips for approved payroll periods</p>
              <p className="text-sm text-muted-foreground">Select a payroll period to generate individual employee payslips</p>
            </div>
          </div>
        </div>
      )}

      {/* Create Period Modal */}
      <CreatePeriodModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreatePeriodSubmit}
        loading={createPayrollPeriod.isLoading}
        existingPeriods={periods}
      />

      {/* Configure Payroll Setup Modal */}
      <ConfigurePayrollModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        employee={selectedEmpForConfig}
      />
    </DashboardLayout>
  );
}