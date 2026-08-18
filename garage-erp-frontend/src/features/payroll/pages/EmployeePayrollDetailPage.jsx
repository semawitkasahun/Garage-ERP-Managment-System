import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, UserCheck, Calculator, TrendingUp, Eye, CheckCircle, CreditCard,
  FileText, ChevronRight, ChevronLeft, Users, Calendar, DollarSign, AlertCircle,
  X, Download, Printer, CheckCircle2, Clock, User, Building, MapPin, Loader2,
  Settings, ArrowUp, ArrowDown,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  usePayrollPeriods,
  useEmployeePayrollDetail,
  useCalculateEmployeeSalary,
  useCalculateEmployeeDeductions,
  useConfirmEmployeeReview,
  useApproveEmployeePayroll,
  useProcessEmployeePayment,
  useEmployeePayslip,
  useEmployeeReceipt,
} from '@/features/payroll/hooks/usePayroll';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/Toast';
import { PaymentModal } from '@/features/payroll/components/PaymentModal';
import { PayslipDocument } from '@/features/payroll/components/PayslipDocument';
import { PaymentReceipt } from '@/features/payroll/components/PaymentReceipt';
import { ConfigurePayrollModal } from '@/features/payroll/components/ConfigurePayrollModal';

const WORKFLOW_STEPS = [
  { id: 'attendance', label: 'Attendance', icon: UserCheck },
  { id: 'salary', label: 'Salary Calculation', icon: Calculator },
  { id: 'deductions', label: 'Deductions', icon: TrendingUp },
  { id: 'review', label: 'Review', icon: Eye },
  { id: 'approval', label: 'Approval', icon: CheckCircle },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'payslip', label: 'Payslip', icon: FileText },
];

const APPROVER_ROLES = ['admin', 'owner', 'supervisor', 'manager', 'hr', 'hr manager', 'hrmanager', 'finance'];

function userCanApprove(user, role) {
  const names = new Set();
  if (role) names.add(String(role).toLowerCase());
  (user?.roles ?? []).forEach((r) => {
    const name = (r?.name ?? r ?? '').toString().toLowerCase();
    if (name) names.add(name);
    if (name === 'hr manager') names.add('hr');
  });
  return [...names].some((r) =>
    APPROVER_ROLES.includes(r) ||
    r.replace(/[\s_-]+/g, '') === 'hrmanager'
  );
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatPeriodRange(period) {
  if (!period) return '';
  const start = period.start_date?.split?.('T')?.[0] ?? period.start_date;
  const end = period.end_date?.split?.('T')?.[0] ?? period.end_date;
  return `${start} – ${end}`;
}

function deriveWorkflowState(payrollItem) {
  const statuses = WORKFLOW_STEPS.map(() => 'pending');
  statuses[0] = 'completed';

  if (!payrollItem) {
    return { currentStep: 0, statuses };
  }

  const { status, deductions, gross_salary } = payrollItem;

  if (status === 'draft' || status === 'pending') {
    return { currentStep: 1, statuses };
  }

  if (status === 'calculated') {
    statuses[1] = 'completed';
    if (gross_salary > 0 && Number(deductions) > 0) {
      statuses[2] = 'completed';
      return { currentStep: 3, statuses };
    }
    return { currentStep: 2, statuses };
  }

  if (status === 'under_review') {
    statuses[1] = statuses[2] = statuses[3] = 'completed';
    return { currentStep: 4, statuses };
  }

  if (status === 'approved') {
    statuses[1] = statuses[2] = statuses[3] = statuses[4] = 'completed';
    return { currentStep: 5, statuses };
  }

  if (status === 'paid') {
    statuses.fill('completed');
    return { currentStep: 6, statuses };
  }

  return { currentStep: 1, statuses };
}

function buildSalaryData(payrollItem, salaryInfo) {
  return {
    basic_salary: payrollItem?.basic_salary ?? salaryInfo?.basic_salary ?? 0,
    allowances: payrollItem?.total_allowances ?? 0,
    overtime: payrollItem?.overtime_pay ?? 0,
    other_earnings: payrollItem?.bonuses ?? 0,
    gross_salary: payrollItem?.gross_salary ?? 0,
  };
}

function buildDeductionsData(payrollItem) {
  const tax = payrollItem?.tax_amount ?? 0;
  const pension = payrollItem?.pension_amount ?? 0;
  const total = payrollItem?.deductions ?? 0;
  return {
    tax,
    pension,
    other_deductions: Math.max(0, total - tax - pension),
    total_deductions: total,
  };
}

export function EmployeePayrollDetailPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role } = useAuthStore();
  const toast = useToast();

  const periodIdFromUrl = searchParams.get('payroll_period_id');
  const [selectedPeriodId, setSelectedPeriodId] = useState(periodIdFromUrl ? Number(periodIdFromUrl) : null);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(WORKFLOW_STEPS.map(() => 'pending'));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { data: periodsData, isLoading: periodsLoading } = usePayrollPeriods({ page: 1 });
  const periods = periodsData?.data ?? [];

  const activePeriodId = selectedPeriodId || (periods[0]?.payroll_period_id ?? null);

  const { data: detailData, isLoading: detailLoading, refetch: refetchDetail } = useEmployeePayrollDetail(
    employeeId,
    { payroll_period_id: activePeriodId }
  );

  const calculateSalary = useCalculateEmployeeSalary();
  const calculateDeductions = useCalculateEmployeeDeductions();
  const confirmReview = useConfirmEmployeeReview();
  const approvePayroll = useApproveEmployeePayroll();
  const processPayment = useProcessEmployeePayment();

  const employee = detailData?.employee;
  const salaryInfo = detailData?.salary_info;
  const period = detailData?.period;
  const attendance = detailData?.attendance;
  const payrollItem = detailData?.payroll_item;
  const payment = detailData?.payment;

  const isPaid = payrollItem?.status === 'paid';
  const { data: payslipData } = useEmployeePayslip(employeeId, {
    payroll_period_id: activePeriodId,
    enabled: isPaid,
  });
  const { data: receiptData } = useEmployeeReceipt(employeeId, {
    payroll_period_id: activePeriodId,
    enabled: isPaid,
  });

  const salaryData = useMemo(() => buildSalaryData(payrollItem, salaryInfo), [payrollItem, salaryInfo]);
  const deductionsData = useMemo(() => buildDeductionsData(payrollItem), [payrollItem]);
  const netPay = payrollItem?.net_pay ?? (salaryData.gross_salary - deductionsData.total_deductions);

  const canApprove = userCanApprove(user, role);

  useEffect(() => {
    if (periodIdFromUrl && !selectedPeriodId) {
      setSelectedPeriodId(Number(periodIdFromUrl));
    } else if (!selectedPeriodId && periods.length > 0) {
      setSelectedPeriodId(periods[0].payroll_period_id);
    }
  }, [periodIdFromUrl, periods, selectedPeriodId]);

  useEffect(() => {
    if (detailData === undefined) return;
    const { currentStep: step, statuses } = deriveWorkflowState(payrollItem);
    setCurrentStep(step);
    setStepStatus(statuses);
  }, [detailData, payrollItem?.status, payrollItem?.payroll_item_id, payrollItem?.deductions]);

  const handlePeriodChange = (newPeriodId) => {
    setSelectedPeriodId(Number(newPeriodId));
    setSearchParams({ payroll_period_id: newPeriodId });
  };

  const runStepAction = async (action) => {
    if (!activePeriodId) {
      toast.error('Please select a payroll period first.');
      return;
    }
    if (!salaryInfo && action !== 'attendance') {
      toast.warning('Please configure salary for this employee first.');
      setConfigModalOpen(true);
      return;
    }

    const payload = { payroll_period_id: activePeriodId };
    setActionLoading(true);
    const newStatus = [...stepStatus];
    newStatus[currentStep] = 'in_progress';
    setStepStatus(newStatus);

    try {
      switch (action) {
        case 'attendance':
          newStatus[0] = 'completed';
          setStepStatus(newStatus);
          setCurrentStep(1);
          toast.success('Attendance data loaded from Attendance module.');
          break;

        case 'salary':
          await calculateSalary.mutateAsync({ employeeId, data: payload });
          await refetchDetail();
          toast.success('Salary calculated successfully.');
          break;

        case 'deductions':
          await calculateDeductions.mutateAsync({ employeeId, data: payload });
          await refetchDetail();
          toast.success('Deductions calculated successfully.');
          break;

        case 'review':
          await confirmReview.mutateAsync({ employeeId, data: payload });
          await refetchDetail();
          setCurrentStep(4);
          toast.success('Submitted for approval.');
          break;

        case 'approve':
          await approvePayroll.mutateAsync({ employeeId, data: payload });
          await refetchDetail();
          setCurrentStep(5);
          toast.success('Payroll approved.');
          break;

        case 'payment':
          setShowPaymentModal(true);
          newStatus[currentStep] = stepStatus[currentStep];
          setStepStatus(newStatus);
          break;

        default:
          break;
      }
    } catch (err) {
      newStatus[currentStep] = 'error';
      setStepStatus(newStatus);
      toast.error(err.response?.data?.message ?? 'An error occurred during this step.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentConfirm = async (formData) => {
    try {
      const result = await processPayment.mutateAsync({
        employeeId,
        data: {
          payroll_period_id: activePeriodId,
          payment_method: formData.payment_method,
          payment_date: formData.payment_date,
          payment_reference: formData.payment_reference || undefined,
          notes: formData.notes || undefined,
        },
      });
      setShowPaymentModal(false);
      await refetchDetail();
      setCurrentStep(6);
      toast.success(`Payment processed. Receipt: ${result.payment?.receipt_number ?? 'generated'}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Payment processing failed.');
      throw err;
    }
  };

  const goToStep = (index) => {
    if (index <= currentStep + 1 || stepStatus[index] === 'completed') {
      setCurrentStep(index);
    }
  };

  const selectedPeriod = period ?? periods.find((p) => p.payroll_period_id === activePeriodId);

  if (detailLoading && !detailData) {
    return (
      <DashboardLayout navSections={getNavSections(user?.role)} pageTitle="Employee Payroll Details" roleLabel={user?.username ?? 'Staff'}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!employee && !detailLoading) {
    return (
      <DashboardLayout navSections={getNavSections(user?.role)} pageTitle="Employee Payroll Details" roleLabel={user?.username ?? 'Staff'}>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Employee Not Found</h3>
          <p className="text-muted-foreground mb-4">The requested employee could not be found.</p>
          <button onClick={() => navigate('/payroll/employees')} className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Employee Payroll
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navSections={getNavSections(user?.role)} pageTitle="Employee Payroll Details" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate(`/payroll/employees${activePeriodId ? `?period=${activePeriodId}` : ''}`)}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <div>
              <h1 className="text-2xl font-display font-semibold">Employee Payroll</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="font-medium text-lg">{employee.name}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{employee.job_title}</span>
              </div>
              {selectedPeriod && (
                <p className="text-sm text-muted-foreground mt-1">
                  Payroll Period: {formatPeriodRange(selectedPeriod)}
                </p>
              )}
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-3 bg-accent/20 p-3 rounded-lg border border-border">
            <Calendar className="h-5 w-5 shrink-0" style={{ color: 'hsl(84 25% 30%)' }} />
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Payroll Period</label>
              {periodsLoading ? (
                <Skeleton className="h-5 w-40 mt-1" />
              ) : (
                <select
                  value={activePeriodId || ''}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="bg-transparent font-medium text-sm outline-none cursor-pointer"
                >
                  {periods.map((p) => (
                    <option key={p.payroll_period_id} value={p.payroll_period_id}>
                      {p.name} ({p.start_date} → {p.end_date})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Employee info card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <InfoItem icon={User} label="Job Title" value={employee.job_title || '—'} color="blue" />
            <InfoItem icon={Building} label="Department" value={employee.department?.name || '—'} color="purple" />
            <InfoItem icon={MapPin} label="Branch" value={employee.branch?.name || '—'} color="green" />
            <InfoItem
              icon={DollarSign}
              label="Salary Setup"
              value={
                salaryInfo ? (
                  <span className="text-emerald-600">Configured · {formatCurrency(salaryInfo.basic_salary)}</span>
                ) : (
                  <button onClick={() => setConfigModalOpen(true)} className="text-amber-600 hover:underline flex items-center gap-1">
                    <Settings className="h-3 w-3" /> Setup Required
                  </button>
                )
              }
              color="orange"
            />
          </div>
        </div>

        {!salaryInfo && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Salary configuration required</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Configure this employee&apos;s salary in Employee Management before processing payroll.
              </p>
              <button
                onClick={() => setConfigModalOpen(true)}
                className="mt-2 text-sm font-medium text-amber-800 hover:underline"
              >
                Configure Payroll →
              </button>
            </div>
          </div>
        )}

        {/* Workflow */}
        {activePeriodId && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-semibold">Payroll Workflow</h3>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {WORKFLOW_STEPS.length}
              </span>
            </div>

            {/* Stepper */}
            <div className="mb-8 overflow-x-auto">
              <div className="flex items-center min-w-[700px]">
                {WORKFLOW_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const status = stepStatus[index];
                  const isCurrent = index === currentStep;
                  const isCompleted = status === 'completed';

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <button
                          onClick={() => goToStep(index)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isCurrent ? 'ring-4 ring-foreground/20' : ''
                          } ${isCompleted ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'} cursor-pointer hover:opacity-80`}
                        >
                          {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                        </button>
                        <p className={`text-[10px] mt-1.5 text-center max-w-[72px] ${isCurrent ? 'font-semibold' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                      </div>
                      {index < WORKFLOW_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${isCompleted ? 'bg-emerald-500' : 'bg-muted'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="border-t border-border pt-6">
              {currentStep === 0 && (
                <AttendanceSection data={attendance} employee={employee} period={selectedPeriod} loading={detailLoading} />
              )}
              {currentStep === 1 && <SalarySection data={salaryData} employee={employee} hasCalculated={!!payrollItem?.gross_salary} />}
              {currentStep === 2 && <DeductionsSection data={deductionsData} grossSalary={salaryData.gross_salary} />}
              {currentStep === 3 && (
                <ReviewSection
                  attendance={attendance}
                  salary={salaryData}
                  deductions={deductionsData}
                  netPay={netPay}
                  employee={employee}
                />
              )}
              {currentStep === 4 && (
                <ApprovalSection
                  employee={employee}
                  netPay={netPay}
                  period={selectedPeriod}
                  status={payrollItem?.status}
                  canApprove={canApprove}
                />
              )}
              {currentStep === 5 && (
                <PaymentSection employee={employee} netPay={netPay} period={selectedPeriod} payment={payment} />
              )}
              {currentStep === 6 && (
                <PayslipSection
                  employee={employee}
                  period={selectedPeriod}
                  payslipData={payslipData}
                  receiptData={receiptData}
                  isPaid={isPaid}
                />
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent/30 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>

                <div className="flex items-center gap-3">
                  {currentStep === 0 && (
                    <ActionButton loading={actionLoading} onClick={() => runStepAction('attendance')}>
                      Continue to Salary Calculation <ChevronRight className="h-4 w-4" />
                    </ActionButton>
                  )}
                  {currentStep === 1 && payrollItem?.status !== 'paid' && (
                    <ActionButton
                      loading={actionLoading || calculateSalary.isPending}
                      onClick={() => runStepAction('salary')}
                      disabled={!salaryInfo}
                    >
                      <Calculator className="h-4 w-4" /> Calculate Salary
                    </ActionButton>
                  )}
                  {currentStep === 2 && !['under_review', 'approved', 'paid'].includes(payrollItem?.status) && (
                    <ActionButton
                      loading={actionLoading || calculateDeductions.isPending}
                      onClick={() => runStepAction('deductions')}
                    >
                      <TrendingUp className="h-4 w-4" /> Calculate Deductions
                    </ActionButton>
                  )}
                  {currentStep === 3 && !['under_review', 'approved', 'paid'].includes(payrollItem?.status) && (
                    <ActionButton loading={actionLoading || confirmReview.isPending} onClick={() => runStepAction('review')}>
                      <Eye className="h-4 w-4" /> Submit for Approval
                    </ActionButton>
                  )}
                  {currentStep === 4 && payrollItem?.status === 'under_review' && canApprove && (
                    <ActionButton loading={actionLoading || approvePayroll.isPending} onClick={() => runStepAction('approve')}>
                      <CheckCircle className="h-4 w-4" /> Approve Payroll
                    </ActionButton>
                  )}
                  {currentStep === 4 && payrollItem?.status === 'under_review' && !canApprove && (
                    <span className="text-sm text-muted-foreground">Awaiting approval from HR/Finance</span>
                  )}
                  {currentStep === 4 && payrollItem?.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" /> Approved
                    </span>
                  )}
                  {currentStep === 5 && payrollItem?.status === 'approved' && (
                    <ActionButton onClick={() => runStepAction('payment')}>
                      <CreditCard className="h-4 w-4" /> Pay Employee
                    </ActionButton>
                  )}
                  {currentStep === 5 && isPaid && (
                    <ActionButton onClick={() => setCurrentStep(6)}>
                      <FileText className="h-4 w-4" /> View Payslip
                    </ActionButton>
                  )}
                  {currentStep < WORKFLOW_STEPS.length - 1 && stepStatus[currentStep] === 'completed' && currentStep !== 5 && (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent/30"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirm}
        employee={employee}
        period={selectedPeriod}
        netSalary={netPay}
        loading={processPayment.isPending}
      />

      <ConfigurePayrollModal
        open={configModalOpen}
        onClose={() => { setConfigModalOpen(false); refetchDetail(); }}
        employee={{ ...employee, id: employee?.id ?? employeeId }}
      />
    </DashboardLayout>
  );
}

function ActionButton({ children, onClick, loading, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50"
      style={{ background: 'hsl(84 25% 30%)' }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

function InfoItem({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colors[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="font-medium text-sm">{value}</div>
      </div>
    </div>
  );
}

function AttendanceSection({ data, employee, period, loading }) {
  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No attendance data available for this period.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <SectionHeader icon={UserCheck} color="blue" title="Attendance" subtitle={`Fetched from Attendance module for ${employee.name}`} />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Working Days" value={data.working_days} />
        <StatCard label="Days Present" value={data.present_days} accent="green" />
        <StatCard label="Absences" value={data.absent_days} accent="red" />
        <StatCard label="Leave Days" value={data.leave_days} accent="orange" />
        <StatCard label="Late Days" value={data.late_days} accent="yellow" />
        <StatCard label="Overtime Hours" value={`${data.overtime_hours ?? 0}h`} accent="purple" />
      </div>
      <p className="text-xs text-muted-foreground">
        Period: {formatPeriodRange(period)} · Data is read automatically — no manual entry required.
      </p>
    </div>
  );
}

function SalarySection({ data, employee, hasCalculated }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={Calculator} color="green" title="Salary Calculation" subtitle={`Based on active salary structure for ${employee.name}`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <LineItem label="Basic Salary" value={formatCurrency(data.basic_salary)} />
          <LineItem label="Allowances" value={formatCurrency(data.allowances)} />
          <LineItem label="Overtime" value={formatCurrency(data.overtime)} />
          <LineItem label="Other Earnings" value={formatCurrency(data.other_earnings)} />
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
          <p className="text-sm text-emerald-700 font-medium mb-1">Gross Salary</p>
          <p className="text-3xl font-bold text-emerald-700">
            {hasCalculated ? formatCurrency(data.gross_salary) : '—'}
          </p>
          {!hasCalculated && <p className="text-xs text-emerald-600 mt-2">Click &quot;Calculate Salary&quot; to compute</p>}
        </div>
      </div>
    </div>
  );
}

function DeductionsSection({ data, grossSalary }) {
  const net = grossSalary - data.total_deductions;
  return (
    <div className="space-y-4">
      <SectionHeader icon={TrendingUp} color="red" title="Deductions" subtitle="Tax, pension, and other deductions" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <LineItem label="Tax" value={formatCurrency(data.tax)} negative />
          <LineItem label="Pension (7%)" value={formatCurrency(data.pension)} negative />
          <LineItem label="Other Deductions" value={formatCurrency(data.other_deductions)} negative />
          <div className="flex justify-between p-3 bg-red-50 border border-red-200 rounded-lg font-semibold text-red-700">
            <span>Total Deductions</span>
            <span>{formatCurrency(data.total_deductions)}</span>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <p className="text-sm text-blue-700 font-medium mb-1">Net Pay</p>
          <p className="text-3xl font-bold text-blue-700">{data.total_deductions > 0 ? formatCurrency(net) : '—'}</p>
          <p className="text-xs text-blue-600 mt-2">Gross Salary − Total Deductions</p>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ attendance, salary, deductions, netPay, employee }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={Eye} color="purple" title="Payroll Review" subtitle={`Complete summary for ${employee.name}`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard title="Attendance" items={[
          ['Working Days', attendance?.working_days ?? '—'],
          ['Present', attendance?.present_days ?? '—'],
          ['Absent', attendance?.absent_days ?? '—'],
          ['Overtime', `${attendance?.overtime_hours ?? 0}h`],
        ]} />
        <SummaryCard title="Earnings" items={[
          ['Basic', formatCurrency(salary.basic_salary)],
          ['Allowances', formatCurrency(salary.allowances)],
          ['Overtime', formatCurrency(salary.overtime)],
          ['Gross', formatCurrency(salary.gross_salary)],
        ]} gross />
        <SummaryCard title="Deductions" items={[
          ['Tax', formatCurrency(deductions.tax)],
          ['Pension', formatCurrency(deductions.pension)],
          ['Other', formatCurrency(deductions.other_deductions)],
          ['Total', formatCurrency(deductions.total_deductions)],
        ]} deduct />
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex flex-col justify-center">
          <p className="text-sm text-blue-700 font-medium">Net Pay</p>
          <p className="text-4xl font-bold text-blue-700 mt-1">{formatCurrency(netPay)}</p>
        </div>
      </div>
    </div>
  );
}

function ApprovalSection({ employee, netPay, period, status, canApprove }) {
  return (
    <div className="space-y-4">
      <SectionHeader icon={CheckCircle} color="green" title="Approval" subtitle="Authorize payroll for payment" />
      <div className="bg-accent/30 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><p className="text-xs text-muted-foreground">Employee</p><p className="font-medium">{employee.name}</p></div>
        <div><p className="text-xs text-muted-foreground">Net Pay</p><p className="text-xl font-bold">{formatCurrency(netPay)}</p></div>
        <div><p className="text-xs text-muted-foreground">Period</p><p className="font-medium">{formatPeriodRange(period)}</p></div>
      </div>
      {status === 'under_review' && canApprove && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          Review complete. Approve to enable payment processing.
        </div>
      )}
      {status === 'approved' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> Payroll approved — ready for payment.
        </div>
      )}
      {!canApprove && status === 'under_review' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
          Awaiting approval from an authorized manager or HR/Finance user.
        </div>
      )}
    </div>
  );
}

function PaymentSection({ employee, netPay, period, payment }) {
  if (payment) {
    return (
      <div className="space-y-4">
        <SectionHeader icon={CreditCard} color="blue" title="Payment Complete" subtitle="Payment has been processed" />
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-bold">{formatCurrency(payment.amount)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="capitalize">{payment.payment_method?.replace('_', ' ')}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{payment.payment_date}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Receipt</span><span className="font-mono">{payment.receipt_number}</span></div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <SectionHeader icon={CreditCard} color="blue" title="Payment" subtitle={`Process payment for ${employee.name}`} />
      <div className="bg-accent/30 rounded-lg p-5">
        <p className="text-sm text-muted-foreground">Net Pay</p>
        <p className="text-3xl font-bold">{formatCurrency(netPay)}</p>
        <p className="text-xs text-muted-foreground mt-2">Period: {formatPeriodRange(period)}</p>
      </div>
      <p className="text-sm text-muted-foreground">Click &quot;Pay Employee&quot; to open the payment form.</p>
    </div>
  );
}

function PayslipSection({ employee, period, payslipData, receiptData, isPaid }) {
  if (!isPaid) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Payslip will be available after payment is processed.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <SectionHeader icon={FileText} color="purple" title="Payslip & Receipt" subtitle={`${employee.name} · ${formatPeriodRange(period)}`} />
      {payslipData ? (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4" /> Payslip</h4>
          <PayslipDocument data={payslipData} />
        </div>
      ) : (
        <Skeleton className="h-48 w-full" />
      )}
      {receiptData ? (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Receipt</h4>
          <PaymentReceipt data={receiptData} />
        </div>
      ) : (
        <Skeleton className="h-32 w-full" />
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, color, title, subtitle }) {
  const colors = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', red: 'bg-red-100 text-red-600', purple: 'bg-purple-100 text-purple-600' };
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className={`p-2.5 rounded-lg ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  const accents = { green: 'text-emerald-700', red: 'text-red-600', orange: 'text-orange-600', yellow: 'text-amber-600', purple: 'text-purple-700' };
  return (
    <div className="bg-accent/30 rounded-lg p-4">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accents[accent] ?? ''}`}>{value}</p>
    </div>
  );
}

function LineItem({ label, value, negative }) {
  return (
    <div className="flex justify-between p-3 bg-accent/30 rounded-lg">
      <span className="font-medium">{label}</span>
      <span className={`font-semibold ${negative ? 'text-red-600' : ''}`}>{negative ? `−${value}` : value}</span>
    </div>
  );
}

function SummaryCard({ title, items, gross, deduct }) {
  return (
    <div className="bg-accent/30 rounded-lg p-4">
      <h5 className="font-semibold mb-3">{title}</h5>
      <div className="space-y-2 text-sm">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className={`font-medium ${deduct && label === 'Total' ? 'text-red-600' : gross && label === 'Gross' ? 'text-emerald-600' : ''}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
