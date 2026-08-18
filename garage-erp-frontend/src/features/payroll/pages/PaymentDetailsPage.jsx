import { useRef, useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Printer, Download, CreditCard, CheckCircle, Clock,
  User, Calendar, ChevronRight, ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useEmployeePayslip, useEmployeeReceipt, usePaymentRecord } from '@/features/payroll/hooks/usePayroll';
import { PayslipDocument } from '@/features/payroll/components/PayslipDocument';
import { PaymentReceipt } from '@/features/payroll/components/PaymentReceipt';
import { Skeleton } from '@/components/ui/skeleton';
import {
  formatCurrency,
  formatPaymentDateLong,
  formatPeriodRangeLong,
  formatPaymentReference,
  getPaymentMethodLabel,
  getPaymentStatusStyle,
} from '@/features/payroll/utils/payrollFormatters';

function DetailRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between items-center py-2.5 border-b border-border/60 ${highlight ? 'bg-accent/20 -mx-2 px-2 rounded-md font-semibold' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-right ${highlight ? 'text-emerald-700 font-bold' : 'font-medium text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

export function PaymentDetailsPage() {
  const { paymentId, itemId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);

  const paymentFromState = location.state?.payment;
  const isPendingRoute = !!itemId;
  const recordId = itemId || paymentId;

  const { data: fetchedPayment, isLoading: paymentLoading } = usePaymentRecord(recordId, {
    type: isPendingRoute ? 'pending' : 'paid',
    enabled: !paymentFromState && !!recordId,
  });

  const payment = paymentFromState ?? fetchedPayment;
  const isPending = isPendingRoute || payment?.status === 'pending';
  const isPaid = !isPending;

  const [activeView, setActiveView] = useState('summary'); // summary | payslip | receipt
  const payslipPrintRef = useRef(null);
  const receiptPrintRef = useRef(null);

  const employeeId = payment?.employee_id;
  const periodId = payment?.period_id;

  const { data: payslipData, isLoading: payslipLoading } = useEmployeePayslip(employeeId, {
    payroll_period_id: periodId,
    enabled: isPaid && !!employeeId && !!periodId,
  });

  const { data: receiptData, isLoading: receiptLoading } = useEmployeeReceipt(employeeId, {
    payroll_period_id: periodId,
    enabled: isPaid && !!employeeId && !!periodId,
  });

  if (paymentLoading) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Payment Details" roleLabel={user?.username ?? 'Staff'}>
        <div className="max-w-4xl mx-auto space-y-4 py-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!payment) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Payment Details" roleLabel={user?.username ?? 'Staff'}>
        <div className="max-w-lg mx-auto text-center py-16">
          <CreditCard className="h-12 w-12 text-muted-foreground opacity-40 mx-auto mb-4" />
          <h2 className="font-display text-lg font-semibold mb-2">Payment record not found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Open this page from Payroll History to view payment details.
          </p>
          <button
            onClick={() => navigate('/payroll-history')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90"
            style={{ background: 'hsl(84 25% 30%)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Payroll History
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusStyle = getPaymentStatusStyle(payment.status);
  const firstName = payment.employee_name?.split(' ')[0] || payment.employee_name;

  const printDocument = (ref, title) => {
    const el = ref?.current;
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${title}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
        @media print { body { padding: 0; } }
      </style></head><body>${el.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const actionButtons = isPaid ? [
    { id: 'view-payslip', label: 'View Payslip', icon: FileText, onClick: () => setActiveView('payslip') },
    { id: 'print-payslip', label: 'Print Payslip', icon: Printer, onClick: () => { setActiveView('payslip'); setTimeout(() => printDocument(payslipPrintRef, `Payslip - ${payment.employee_name}`), 300); } },
    { id: 'download-payslip', label: 'Download Payslip', icon: Download, onClick: () => { setActiveView('payslip'); setTimeout(() => printDocument(payslipPrintRef, `Payslip - ${payment.employee_name}`), 300); } },
    { id: 'view-receipt', label: 'View Receipt', icon: CheckCircle, onClick: () => setActiveView('receipt') },
    { id: 'print-receipt', label: 'Print Receipt', icon: Printer, onClick: () => { setActiveView('receipt'); setTimeout(() => printDocument(receiptPrintRef, `Receipt - ${formatPaymentReference(payment)}`), 300); } },
  ] : [];

  return (
    <DashboardLayout navSections={navSections} pageTitle="Payment Details" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <Link to="/payroll-history" className="hover:text-foreground transition-colors">Payroll History</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-medium">{firstName}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{formatPeriodRangeLong(payment)}</span>
        </nav>

        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/payroll-history')}
              className="p-2 rounded-lg border border-border hover:bg-accent/40 transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display text-2xl font-semibold tracking-tight">Payment Details</h1>
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  style={{ background: statusStyle.bg, color: statusStyle.text }}
                >
                  {statusStyle.icon === 'check' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {statusStyle.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {payment.employee_name} · {formatPaymentReference(payment)}
              </p>
            </div>
          </div>
        </div>

        {/* Traceability Links */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/payroll/employee/${payment.employee_id}?payroll_period_id=${payment.period_id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors"
          >
            <User className="h-3.5 w-3.5" /> Employee Payroll
            <ExternalLink className="h-3 w-3 opacity-50" />
          </button>
          <button
            onClick={() => navigate(`/payroll/employees?period=${payment.period_id}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" /> Payroll Period
            <ExternalLink className="h-3 w-3 opacity-50" />
          </button>
        </div>

        {/* Status Banner */}
        {isPaid ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Payment Completed</p>
              <p className="text-xs text-emerald-700">
                {formatPaymentDateLong(payment.payment_date)} via {getPaymentMethodLabel(payment.payment_method)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Payment Pending</p>
                <p className="text-xs text-amber-700">
                  Payroll approved — process payment from Employee Payroll
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/payroll/employee/${payment.employee_id}?payroll_period_id=${payment.period_id}`)}
              className="shrink-0 px-3 py-1.5 text-xs font-medium text-white rounded-lg hover:opacity-90"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              Process Payment
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Summary Card */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="font-display text-base font-semibold mb-4 pb-2 border-b border-border">
              Payment Summary
            </h2>
            <div className="space-y-0">
              <DetailRow label="Employee" value={payment.employee_name} />
              <DetailRow label="Payroll Period" value={formatPeriodRangeLong(payment)} />
              <DetailRow label="Gross Salary" value={formatCurrency(payment.gross_salary)} />
              <DetailRow label="Total Deductions" value={formatCurrency(payment.total_deductions)} />
              <DetailRow label="Net Salary" value={formatCurrency(payment.net_salary)} highlight />
              {isPaid && (
                <>
                  <DetailRow label="Payment Method" value={getPaymentMethodLabel(payment.payment_method)} />
                  <DetailRow label="Payment Date" value={formatPaymentDateLong(payment.payment_date)} />
                  <DetailRow label="Payment Reference" value={formatPaymentReference(payment)} />
                  <DetailRow label="Status" value="Paid" />
                </>
              )}
              {isPending && (
                <DetailRow label="Status" value="Pending" />
              )}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-fit">
            <h2 className="font-display text-base font-semibold mb-4 pb-2 border-b border-border">Actions</h2>
            {isPaid ? (
              <div className="space-y-2">
                {actionButtons.map(({ id, label, icon: Icon, onClick }) => (
                  <button
                    key={id}
                    onClick={onClick}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors text-left"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Payslip and receipt actions become available after payment is processed.
              </p>
            )}
          </div>
        </div>

        {/* Document Views */}
        {isPaid && activeView !== 'summary' && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold">
                {activeView === 'payslip' ? 'Payslip' : 'Payment Receipt'}
              </h2>
              <button
                onClick={() => setActiveView('summary')}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Back to summary
              </button>
            </div>

            {activeView === 'payslip' && (
              payslipLoading ? (
                <div className="py-12 text-center"><Skeleton className="h-48 w-full" /></div>
              ) : payslipData ? (
                <div ref={payslipPrintRef}>
                  <PayslipDocument data={payslipData} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Payslip unavailable.</p>
              )
            )}

            {activeView === 'receipt' && (
              receiptLoading ? (
                <div className="py-12 text-center"><Skeleton className="h-48 w-full" /></div>
              ) : receiptData ? (
                <div ref={receiptPrintRef}>
                  <PaymentReceipt data={receiptData} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Receipt unavailable.</p>
              )
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
