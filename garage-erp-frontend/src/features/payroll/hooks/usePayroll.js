import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '../api/payrollApi';

// Payroll Periods Hooks
export function usePayrollPeriods(params = {}) {
  return useQuery({
    queryKey: ['payrollPeriods', params],
    queryFn: () => payrollApi.listPayrollPeriods(params),
  });
}

export function usePayrollPeriod(payrollPeriodId) {
  return useQuery({
    queryKey: ['payrollPeriod', payrollPeriodId],
    queryFn: () => payrollApi.getPayrollPeriod(payrollPeriodId),
    enabled: !!payrollPeriodId,
  });
}

export function usePayrollPeriodsSummary() {
  return useQuery({
    queryKey: ['payrollPeriodsSummary'],
    queryFn: () => payrollApi.getPayrollPeriodsSummary(),
  });
}

export function usePayrollPeriodMonthStats(params = {}) {
  return useQuery({
    queryKey: ['payrollPeriodMonthStats', params],
    queryFn: () => payrollApi.getPayrollPeriodMonthStats(params),
  });
}

export function usePayrollDashboardMetrics() {
  return useQuery({
    queryKey: ['payrollDashboardMetrics'],
    queryFn: () => payrollApi.getPayrollDashboardMetrics(),
  });
}

// Payroll Reports Hooks
export function usePayrollSummaryReport(params = {}) {
  return useQuery({
    queryKey: ['payrollSummaryReport', params],
    queryFn: () => payrollApi.getPayrollSummaryReport(params),
    enabled: !!params.start_date && !!params.end_date,
  });
}

export function useEmployeeCostAnalysis(params = {}) {
  return useQuery({
    queryKey: ['employeeCostAnalysis', params],
    queryFn: () => payrollApi.getEmployeeCostAnalysis(params),
    enabled: !!params.start_date && !!params.end_date,
  });
}

export function usePeriodComparison(params = {}) {
  return useQuery({
    queryKey: ['periodComparison', params],
    queryFn: () => payrollApi.getPeriodComparison(params),
    enabled: !!params.period1_id && !!params.period2_id,
  });
}

export function useDepartmentReport(params = {}) {
  return useQuery({
    queryKey: ['departmentReport', params],
    queryFn: () => payrollApi.getDepartmentReport(params),
    enabled: !!params.department_id,
  });
}

export function useDeductionAnalysis(params = {}) {
  return useQuery({
    queryKey: ['deductionAnalysis', params],
    queryFn: () => payrollApi.getDeductionAnalysis(params),
    enabled: !!params.start_date && !!params.end_date,
  });
}

export function usePaymentHistory(params = {}) {
  return useQuery({
    queryKey: ['paymentHistory', params],
    queryFn: () => payrollApi.getPaymentHistory(params),
  });
}

export function usePaymentRecord(id, { type = 'paid', enabled = true } = {}) {
  return useQuery({
    queryKey: ['paymentRecord', id, type],
    queryFn: () => payrollApi.getPaymentRecord(id, { type }),
    enabled: !!id && enabled,
  });
}

export function useComprehensivePayrollReport(params = {}) {
  return useQuery({
    queryKey: ['comprehensivePayrollReport', params],
    queryFn: () => payrollApi.getComprehensiveReport(params),
  });
}

// Payslip Hooks
export function useGeneratePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.generatePayslip,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useGenerateBulkPayslips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.generateBulkPayslips,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollPeriods']);
    },
  });
}

export function useDownloadPayslip() {
  return useMutation({
    mutationFn: payrollApi.downloadPayslip,
  });
}

// Workflow Step Hooks
export function useImportAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.importAttendance,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables.payroll_period_id]);
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['employeePayrollList']);
    },
  });
}

export function useCalculateSalaries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.calculateSalaries,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables.payroll_period_id]);
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['payrollItems']);
      queryClient.invalidateQueries(['employeePayrollList']);
    },
  });
}

export function useCalculateDeductions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.calculateDeductions,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables.payroll_period_id]);
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['payrollItems']);
      queryClient.invalidateQueries(['employeePayrollList']);
    },
  });
}

export function useReviewPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.reviewPayroll,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables.payroll_period_id]);
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['employeePayrollList']);
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.processPayment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables.payroll_period_id]);
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['paymentHistory']);
    },
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createPayrollPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['payrollPeriodsSummary']);
    },
  });
}

export function useUpdatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updatePayrollPeriod(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['payrollPeriod', variables.id]);
    },
  });
}

export function useDeletePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deletePayrollPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['payrollPeriodsSummary']);
    },
  });
}

export function useProcessPayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.processPayrollPeriod,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables]);
      queryClient.invalidateQueries(['payrollPeriods']);
    },
  });
}

export function useApprovePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.approvePayrollPeriod,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables]);
      queryClient.invalidateQueries(['payrollPeriods']);
    },
  });
}

export function useMarkPayrollPeriodAsPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.markAsPaid,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollPeriod', variables]);
      queryClient.invalidateQueries(['payrollPeriods']);
    },
  });
}

// Payroll Runs Hooks
export function usePayrollRuns(params = {}) {
  return useQuery({
    queryKey: ['payrollRuns', params],
    queryFn: () => payrollApi.listPayrollRuns(params),
  });
}

export function usePayrollRun(payrollRunId) {
  return useQuery({
    queryKey: ['payrollRun', payrollRunId],
    queryFn: () => payrollApi.getPayrollRun(payrollRunId),
    enabled: !!payrollRunId,
  });
}

export function usePayrollRunsSummary() {
  return useQuery({
    queryKey: ['payrollRunsSummary'],
    queryFn: () => payrollApi.getPayrollRunsSummary(),
  });
}

export function usePendingPayrollRuns() {
  return useQuery({
    queryKey: ['pendingPayrollRuns'],
    queryFn: () => payrollApi.getPendingPayrollRuns(),
  });
}

export function useCreatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createPayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRuns']);
      queryClient.invalidateQueries(['payrollRunsSummary']);
    },
  });
}

export function useUpdatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updatePayrollRun(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollRuns']);
      queryClient.invalidateQueries(['payrollRun', variables.id]);
    },
  });
}

export function useDeletePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deletePayrollRun,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollRuns']);
      queryClient.invalidateQueries(['payrollRunsSummary']);
    },
  });
}

export function useProcessPayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.processPayrollRun,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollRun', variables]);
      queryClient.invalidateQueries(['payrollRuns']);
    },
  });
}

export function useCalculatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.calculatePayrollRun,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollRun', variables]);
      queryClient.invalidateQueries(['payrollRuns']);
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useApprovePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.approvePayrollRun,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollRun', variables]);
      queryClient.invalidateQueries(['payrollRuns']);
    },
  });
}

// Payroll Items Hooks
export function usePayrollItems(params = {}) {
  return useQuery({
    queryKey: ['payrollItems', params],
    queryFn: () => payrollApi.listPayrollItems(params),
  });
}

export function usePayrollItem(payrollItemId) {
  return useQuery({
    queryKey: ['payrollItem', payrollItemId],
    queryFn: () => payrollApi.getPayrollItem(payrollItemId),
    enabled: !!payrollItemId,
  });
}

export function usePayrollItemsByRun(payrollRunId) {
  return useQuery({
    queryKey: ['payrollItems', 'run', payrollRunId],
    queryFn: () => payrollApi.getPayrollItemsByRun(payrollRunId),
    enabled: !!payrollRunId,
  });
}

export function usePayrollItemsByEmployee(employeeId) {
  return useQuery({
    queryKey: ['payrollItems', 'employee', employeeId],
    queryFn: () => payrollApi.getPayrollItemsByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function usePayrollItemsSummary(payrollRunId) {
  return useQuery({
    queryKey: ['payrollItemsSummary', payrollRunId],
    queryFn: () => payrollApi.getPayrollItemsSummary(payrollRunId),
    enabled: !!payrollRunId,
  });
}

export function useCreatePayrollItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createPayrollItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useBulkCreatePayrollItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.bulkCreatePayrollItems,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollItems']);
      queryClient.invalidateQueries(['payrollRuns']);
    },
  });
}

export function useUpdatePayrollItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updatePayrollItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollItems']);
      queryClient.invalidateQueries(['payrollItem', variables.id]);
    },
  });
}

export function useDeletePayrollItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deletePayrollItem,
    onSuccess: () => {
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useAddAllowanceToPayrollItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.addAllowanceToPayrollItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollItem', variables.id]);
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useAddDeductionToPayrollItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.addDeductionToPayrollItem(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['payrollItem', variables.id]);
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

// Salary Structures Hooks
export function useSalaryStructures(params = {}) {
  return useQuery({
    queryKey: ['salaryStructures', params],
    queryFn: () => payrollApi.listSalaryStructures(params),
  });
}

export function useSalaryStructure(salaryStructureId) {
  return useQuery({
    queryKey: ['salaryStructure', salaryStructureId],
    queryFn: () => payrollApi.getSalaryStructure(salaryStructureId),
    enabled: !!salaryStructureId,
  });
}

export function useActiveSalaryStructures() {
  return useQuery({
    queryKey: ['activeSalaryStructures'],
    queryFn: () => payrollApi.getActiveSalaryStructures(),
  });
}

export function useCreateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createSalaryStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaryStructures']);
      queryClient.invalidateQueries(['activeSalaryStructures']);
    },
  });
}

export function useUpdateSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateSalaryStructure(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['salaryStructures']);
      queryClient.invalidateQueries(['salaryStructure', variables.id]);
    },
  });
}

export function useDeleteSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deleteSalaryStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['salaryStructures']);
      queryClient.invalidateQueries(['activeSalaryStructures']);
    },
  });
}

export function useAssignSalaryStructureToEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.assignSalaryStructureToEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['employeeSalaryStructures']);
      queryClient.invalidateQueries(['salaryStructures']);
    },
  });
}

// Allowances Hooks
export function useAllowances(params = {}) {
  return useQuery({
    queryKey: ['allowances', params],
    queryFn: () => payrollApi.listAllowances(params),
  });
}

export function useAllowance(allowanceId) {
  return useQuery({
    queryKey: ['allowance', allowanceId],
    queryFn: () => payrollApi.getAllowance(allowanceId),
    enabled: !!allowanceId,
  });
}

export function useActiveAllowances() {
  return useQuery({
    queryKey: ['activeAllowances'],
    queryFn: () => payrollApi.getActiveAllowances(),
  });
}

export function useTaxableAllowances() {
  return useQuery({
    queryKey: ['taxableAllowances'],
    queryFn: () => payrollApi.getTaxableAllowances(),
  });
}

export function useCreateAllowance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createAllowance,
    onSuccess: () => {
      queryClient.invalidateQueries(['allowances']);
      queryClient.invalidateQueries(['activeAllowances']);
    },
  });
}

export function useUpdateAllowance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateAllowance(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['allowances']);
      queryClient.invalidateQueries(['allowance', variables.id]);
    },
  });
}

export function useDeleteAllowance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deleteAllowance,
    onSuccess: () => {
      queryClient.invalidateQueries(['allowances']);
      queryClient.invalidateQueries(['activeAllowances']);
    },
  });
}

// Deductions Hooks
export function useDeductions(params = {}) {
  return useQuery({
    queryKey: ['deductions', params],
    queryFn: () => payrollApi.listDeductions(params),
  });
}

export function useDeduction(deductionId) {
  return useQuery({
    queryKey: ['deduction', deductionId],
    queryFn: () => payrollApi.getDeduction(deductionId),
    enabled: !!deductionId,
  });
}

export function useActiveDeductions() {
  return useQuery({
    queryKey: ['activeDeductions'],
    queryFn: () => payrollApi.getActiveDeductions(),
  });
}

export function useCreateDeduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createDeduction,
    onSuccess: () => {
      queryClient.invalidateQueries(['deductions']);
      queryClient.invalidateQueries(['activeDeductions']);
    },
  });
}

export function useUpdateDeduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateDeduction(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['deductions']);
      queryClient.invalidateQueries(['deduction', variables.id]);
    },
  });
}

export function useDeleteDeduction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deleteDeduction,
    onSuccess: () => {
      queryClient.invalidateQueries(['deductions']);
      queryClient.invalidateQueries(['activeDeductions']);
    },
  });
}

// Employee Salary Structures Hooks
export function useEmployeeSalaryStructures(params = {}) {
  return useQuery({
    queryKey: ['employeeSalaryStructures', params],
    queryFn: () => payrollApi.listEmployeeSalaryStructures(params),
  });
}

export function useCurrentEmployeeSalaryStructure(employeeId) {
  return useQuery({
    queryKey: ['currentEmployeeSalaryStructure', employeeId],
    queryFn: () => payrollApi.getCurrentEmployeeSalaryStructure(employeeId),
    enabled: !!employeeId,
  });
}

export function useEmployeeSalaryStructureHistory(employeeId) {
  return useQuery({
    queryKey: ['employeeSalaryStructureHistory', employeeId],
    queryFn: () => payrollApi.getEmployeeSalaryStructureHistory(employeeId),
    enabled: !!employeeId,
  });
}

export function useCreateEmployeeSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.createEmployeeSalaryStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['employeeSalaryStructures']);
    },
  });
}

export function useUpdateEmployeeSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollApi.updateEmployeeSalaryStructure(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employeeSalaryStructures']);
      queryClient.invalidateQueries(['employeeSalaryStructure', variables.id]);
    },
  });
}

export function useDeleteEmployeeSalaryStructure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.deleteEmployeeSalaryStructure,
    onSuccess: () => {
      queryClient.invalidateQueries(['employeeSalaryStructures']);
    },
  });
}

// Employee Payroll Profiles Hook (for Employee Payroll section)
export function useEmployeePayrollProfiles(params = {}) {
  return useQuery({
    queryKey: ['employeePayrollProfiles', params],
    queryFn: () => payrollApi.getEmployeePayrollProfiles(params),
  });
}

// ─── Employee Payroll Workflow Hooks (Per-Employee) ──────────────

export function useEmployeePayrollList(params = {}) {
  return useQuery({
    queryKey: ['employeePayrollList', params],
    queryFn: () => payrollApi.getEmployeePayrollList(params),
    enabled: !!params.payroll_period_id,
  });
}

export function useEmployeePayrollDetail(employeeId, params = {}) {
  return useQuery({
    queryKey: ['employeePayrollDetail', employeeId, params],
    queryFn: () => payrollApi.getEmployeePayrollDetail(employeeId, params),
    enabled: !!employeeId && !!params.payroll_period_id,
  });
}

export function useEmployeeAttendance(employeeId, params = {}) {
  return useQuery({
    queryKey: ['employeeAttendance', employeeId, params],
    queryFn: () => payrollApi.getEmployeeAttendance(employeeId, params),
    enabled: !!employeeId && !!params.payroll_period_id,
  });
}

export function useCalculateEmployeeSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => payrollApi.calculateEmployeeSalary(employeeId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employeePayrollDetail', variables.employeeId]);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useCalculateEmployeeDeductions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => payrollApi.calculateEmployeeDeductions(employeeId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employeePayrollDetail', variables.employeeId]);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useConfirmEmployeeReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => payrollApi.confirmEmployeeReview(employeeId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employeePayrollDetail', variables.employeeId]);
      queryClient.invalidateQueries(['employeePayrollList']);
    },
  });
}

export function useApproveEmployeePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => payrollApi.approveEmployeePayroll(employeeId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employeePayrollDetail', variables.employeeId]);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['payrollItems']);
    },
  });
}

export function useProcessEmployeePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }) => payrollApi.processEmployeePayment(employeeId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['employeePayrollDetail', variables.employeeId]);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['employeePayslip', variables.employeeId]);
      queryClient.invalidateQueries(['employeeReceipt', variables.employeeId]);
      queryClient.invalidateQueries(['payrollPeriods']);
      queryClient.invalidateQueries(['paymentHistory']);
    },
  });
}

export function useEmployeePayslip(employeeId, params = {}) {
  return useQuery({
    queryKey: ['employeePayslip', employeeId, params],
    queryFn: () => payrollApi.getEmployeePayslip(employeeId, params),
    enabled: !!employeeId && !!params.payroll_period_id && !!params.enabled,
  });
}

export function useEmployeeReceipt(employeeId, params = {}) {
  return useQuery({
    queryKey: ['employeeReceipt', employeeId, params],
    queryFn: () => payrollApi.getEmployeeReceipt(employeeId, params),
    enabled: !!employeeId && !!params.payroll_period_id && !!params.enabled,
  });
}