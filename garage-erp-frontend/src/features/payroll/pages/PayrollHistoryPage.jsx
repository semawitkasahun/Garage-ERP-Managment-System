import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign, Calendar, CreditCard, Clock, CheckCircle, Search, Filter,
  Eye, X, Users, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { usePayrollPeriods, usePaymentHistory } from '@/features/payroll/hooks/usePayroll';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrency,
  formatPaymentDate,
  formatPeriodLabel,
  formatPaymentReference,
  getPaymentMethodStyle,
  getPaymentStatusStyle,
} from '@/features/payroll/utils/payrollFormatters';

export function PayrollHistoryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const navSections = getNavSections(user?.role);

  const [historySearch, setHistorySearch] = useState('');
  const [historyPeriod, setHistoryPeriod] = useState('all');
  const [historyMethod, setHistoryMethod] = useState('all');
  const [historyStatus, setHistoryStatus] = useState('all');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const { data: periodsData } = usePayrollPeriods({ page: 1, per_page: 100 });
  const { data: paymentHistoryData, isLoading: paymentHistoryLoading } = usePaymentHistory({
    search: historySearch,
    payroll_period_id: historyPeriod,
    payment_method: historyMethod,
    status: historyStatus,
    start_date: historyStartDate,
    end_date: historyEndDate,
  });

  const summary = paymentHistoryData?.summary ?? {};
  const paymentsList = paymentHistoryData?.payments ?? [];
  const periodsList = periodsData?.data ?? [];

  const resetFilters = () => {
    setHistorySearch('');
    setHistoryPeriod('all');
    setHistoryMethod('all');
    setHistoryStatus('all');
    setHistoryStartDate('');
    setHistoryEndDate('');
  };

  const handleViewPayment = (payment) => {
    if (payment.status === 'pending' && payment.payroll_item_id) {
      navigate(`/payroll-history/pending/${payment.payroll_item_id}`, {
        state: { payment },
      });
      return;
    }
    if (payment.payroll_payment_id) {
      navigate(`/payroll-history/${payment.payroll_payment_id}`, {
        state: { payment },
      });
    }
  };

  return (
    <DashboardLayout
      navSections={navSections}
      pageTitle="Payroll History"
      roleLabel={user?.username ?? 'Staff'}
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/payroll')}
              className="p-2 rounded-lg border border-border hover:bg-accent/40 transition-colors shrink-0 mt-0.5"
              title="Back to Payroll Management"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Payroll History</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Completed payroll payments linked to employees, periods, and payslips
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/payroll/employees')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors"
            >
              <Users className="h-3.5 w-3.5" /> Employee Payroll
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Payments',
              value: summary.total_payments ?? 0,
              sub: 'Payment records',
              icon: CreditCard,
              color: 'hsl(84 25% 30%)',
              bg: 'hsl(84 20% 91%)',
              format: (v) => v,
            },
            {
              label: 'Total Amount Paid',
              value: summary.total_amount_paid ?? 0,
              sub: 'Cumulative disbursement',
              icon: DollarSign,
              color: 'hsl(145 45% 30%)',
              bg: 'hsl(145 35% 93%)',
              format: formatCurrency,
            },
            {
              label: 'This Month',
              value: summary.this_month_paid ?? 0,
              sub: 'Paid this calendar month',
              icon: Calendar,
              color: 'hsl(200 50% 30%)',
              bg: 'hsl(200 40% 92%)',
              format: formatCurrency,
            },
            {
              label: 'Pending Payments',
              value: summary.pending_payments ?? 0,
              sub: 'Approved, awaiting payment',
              icon: Clock,
              color: 'hsl(30 50% 35%)',
              bg: 'hsl(30 50% 90%)',
              format: (v) => v,
            },
          ].map(({ label, value, sub, icon: Icon, color, bg, format }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg shrink-0" style={{ background: bg }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{label}</p>
                  <p className="font-display text-2xl font-bold mt-0.5 truncate">
                    {paymentHistoryLoading ? <Skeleton className="h-7 w-16 inline-block" /> : format(value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-3">
            <Filter className="h-3.5 w-3.5" /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Name or payment reference..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-8 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Payroll Period</label>
              <select
                value={historyPeriod}
                onChange={(e) => setHistoryPeriod(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Periods</option>
                {periodsList.map((p) => (
                  <option key={p.payroll_period_id} value={p.payroll_period_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Payment Date From</label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Payment Date To</label>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Payment Method</label>
              <select
                value={historyMethod}
                onChange={(e) => setHistoryMethod(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Methods</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 px-2.5 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-accent/10 flex items-center justify-between">
            <p className="text-sm font-medium">
              {paymentHistoryLoading ? 'Loading...' : `${paymentsList.length} record${paymentsList.length !== 1 ? 's' : ''}`}
            </p>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Employee → Period → Calculation → Payment
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/20 text-left">
                  {['Employee', 'Payroll Period', 'Net Salary', 'Payment Method', 'Payment Date', 'Payment Reference', 'Status', 'Actions'].map((col) => (
                    <th
                      key={col}
                      className={`px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium ${
                        ['Net Salary', 'Actions'].includes(col) ? 'text-right' : ''
                      }`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paymentHistoryLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {[...Array(8)].map((__, j) => (
                        <td key={j} className="px-5 py-3.5"><Skeleton className="h-4 w-20" /></td>
                      ))}
                    </tr>
                  ))
                ) : paymentsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <CreditCard className="h-10 w-10 text-muted-foreground opacity-40 mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No payment records found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        Process employee payments from Employee Payroll to build payment history.
                      </p>
                      <button
                        onClick={() => navigate('/payroll/employees')}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white rounded-lg hover:opacity-90"
                        style={{ background: 'hsl(84 25% 30%)' }}
                      >
                        Go to Employee Payroll <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ) : (
                  paymentsList.map((payment) => {
                    const methodStyle = getPaymentMethodStyle(payment.payment_method);
                    const statusStyle = getPaymentStatusStyle(payment.status);
                    const rowKey = payment.payroll_payment_id ?? `pending-${payment.payroll_item_id}`;

                    return (
                      <tr
                        key={rowKey}
                        className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0"
                              style={{ background: 'hsl(84 25% 30%)' }}
                            >
                              {payment.employee_name?.[0] || 'E'}
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/payroll/employee/${payment.employee_id}?payroll_period_id=${payment.period_id}`)}
                                className="font-medium text-foreground hover:underline text-left"
                              >
                                {payment.employee_name?.split(' ')[0] || payment.employee_name}
                              </button>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {payment.employee_code} · {payment.job_title}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => navigate(`/payroll/employees?period=${payment.period_id}`)}
                            className="font-medium text-xs text-foreground hover:underline text-left"
                          >
                            {formatPeriodLabel(payment)}
                          </button>
                        </td>

                        <td className="px-5 py-3.5 text-right font-bold tabular-nums text-emerald-700">
                          {formatCurrency(payment.net_salary)}
                        </td>

                        <td className="px-5 py-3.5">
                          {payment.payment_method ? (
                            <span
                              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                              style={{ background: methodStyle.bg, color: methodStyle.text }}
                            >
                              {methodStyle.label}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-muted-foreground text-xs">
                          {formatPaymentDate(payment.payment_date)}
                        </td>

                        <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">
                          {formatPaymentReference(payment)}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                            style={{ background: statusStyle.bg, color: statusStyle.text }}
                          >
                            {statusStyle.icon === 'check' ? (
                              <CheckCircle className="h-3 w-3 shrink-0" />
                            ) : (
                              <Clock className="h-3 w-3 shrink-0" />
                            )}
                            {statusStyle.label}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors hover:opacity-90 inline-flex items-center gap-1.5 shadow-sm"
                            style={{ background: 'hsl(84 25% 30%)' }}
                          >
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
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
    </DashboardLayout>
  );
}
