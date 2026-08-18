import apiClient from '@/services/http/axios';

export const payrollApi = {
  // Payroll Periods
  async listPayrollPeriods({ branch_id, status, from_date, to_date, page } = {}) {
    const { data } = await apiClient.get('/payroll-periods', { 
      params: { 
        branch_id, 
        status, 
        from_date, 
        to_date, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createPayrollPeriod(payload) {
    const { data } = await apiClient.post('/payroll-periods', payload);
    return data;
  },
  
  async getPayrollPeriod(payrollPeriodId) {
    const { data } = await apiClient.get(`/payroll-periods/${payrollPeriodId}`);
    return data;
  },
  
  async updatePayrollPeriod(payrollPeriodId, payload) {
    const { data } = await apiClient.patch(`/payroll-periods/${payrollPeriodId}`, payload);
    return data;
  },
  
  async deletePayrollPeriod(payrollPeriodId) {
    await apiClient.delete(`/payroll-periods/${payrollPeriodId}`);
  },
  
  async processPayrollPeriod(payrollPeriodId) {
    const { data } = await apiClient.post(`/payroll-periods/${payrollPeriodId}/process`);
    return data;
  },
  
  async submitForApproval(payrollPeriodId) {
    const { data } = await apiClient.post(`/payroll-periods/${payrollPeriodId}/submit-approval`);
    return data;
  },
  
  async approvePayrollPeriod(payrollPeriodId) {
    const { data } = await apiClient.post(`/payroll-periods/${payrollPeriodId}/approve`);
    return data;
  },
  
  async markAsPaid(payrollPeriodId) {
    const { data } = await apiClient.post(`/payroll-periods/${payrollPeriodId}/mark-paid`);
    return data;
  },
  
  async cancelPayrollPeriod(payrollPeriodId) {
    const { data } = await apiClient.post(`/payroll-periods/${payrollPeriodId}/cancel`);
    return data;
  },
  
  async getPayrollPeriodsSummary() {
    const { data } = await apiClient.get('/payroll-periods/summary');
    return data;
  },

  async getPayrollDashboardMetrics() {
    const { data } = await apiClient.get('/payroll-periods/dashboard-metrics');
    return data;
  },

  async getPayrollPeriodMonthStats({ month, year, branch_id } = {}) {
    const { data } = await apiClient.get('/payroll-periods/month-stats', {
      params: { month, year, branch_id },
    });
    return data;
  },

  // Payroll Reports
  async getPayrollSummaryReport({ start_date, end_date, branch_id } = {}) {
    const { data } = await apiClient.get('/payroll-reports/summary', {
      params: { start_date, end_date, branch_id }
    });
    return data;
  },

  async getEmployeeCostAnalysis({ start_date, end_date, employee_id } = {}) {
    const { data } = await apiClient.get('/payroll-reports/employee-cost', {
      params: { start_date, end_date, employee_id }
    });
    return data;
  },

  async getPeriodComparison({ period1_id, period2_id } = {}) {
    const { data } = await apiClient.get('/payroll-reports/period-comparison', {
      params: { period1_id, period2_id }
    });
    return data;
  },

  async getDepartmentReport({ department_id, start_date, end_date } = {}) {
    const { data } = await apiClient.get('/payroll-reports/department', {
      params: { department_id, start_date, end_date }
    });
    return data;
  },

  async getDeductionAnalysis({ start_date, end_date, deduction_type } = {}) {
    const { data } = await apiClient.get('/payroll-reports/deductions', {
      params: { start_date, end_date, deduction_type }
    });
    return data;
  },

  async getPaymentHistory({ search, payroll_period_id, start_date, end_date, payment_method, status } = {}) {
    const { data } = await apiClient.get('/payroll-reports/payment-history', {
      params: { search, payroll_period_id, start_date, end_date, payment_method, status }
    });
    return data;
  },

  async getPaymentRecord(id, { type = 'paid' } = {}) {
    const { data } = await apiClient.get(`/payroll-reports/payment-history/${id}`, {
      params: { type },
    });
    return data.payment;
  },

  async getComprehensiveReport(params = {}) {
    const { data } = await apiClient.get('/payroll-reports/comprehensive', { params });
    return data;
  },

  // Payslip Generation
  async generatePayslip(payrollItemId) {
    const { data } = await apiClient.post(`/payroll-items/${payrollItemId}/generate-payslip`);
    return data;
  },

  async generateBulkPayslips(payrollPeriodId) {
    const { data } = await apiClient.post(`/payroll-periods/${payrollPeriodId}/generate-payslips`);
    return data;
  },

  async downloadPayslip(payrollItemId) {
    const { data } = await apiClient.get(`/payroll-items/${payrollItemId}/download-payslip`, {
      responseType: 'blob'
    });
    return data;
  },

  // Workflow Steps
  async importAttendance({ payroll_period_id, employee_id }) {
    const { data } = await apiClient.post(`/payroll-periods/${payroll_period_id}/import-attendance`, { employee_id });
    return data;
  },

  async calculateSalaries({ payroll_period_id, employee_id }) {
    const { data } = await apiClient.post(`/payroll-periods/${payroll_period_id}/calculate-salaries`, { employee_id });
    return data;
  },

  async calculateDeductions({ payroll_period_id, employee_id }) {
    const { data } = await apiClient.post(`/payroll-periods/${payroll_period_id}/calculate-deductions`, { employee_id });
    return data;
  },

  async reviewPayroll({ payroll_period_id, employee_id }) {
    const { data } = await apiClient.post(`/payroll-periods/${payroll_period_id}/review`, { employee_id });
    return data;
  },

  async processPayment({ payroll_period_id, employee_id, payment_method, payment_date, payment_reference, notes }) {
    const { data } = await apiClient.post(`/payroll-periods/${payroll_period_id}/process-payment`, {
      employee_id,
      payment_method,
      payment_date,
      payment_reference,
      notes
    });
    return data;
  },
  
  async getPayrollPeriodsByBranch(branchId) {
    const { data } = await apiClient.get(`/payroll-periods/branch/${branchId}`);
    return data;
  },

  // Payroll Runs
  async listPayrollRuns({ branch_id, status, payroll_period_id, from_date, to_date, page } = {}) {
    const { data } = await apiClient.get('/payroll-runs', { 
      params: { 
        branch_id, 
        status, 
        payroll_period_id,
        from_date, 
        to_date, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createPayrollRun(payload) {
    const { data } = await apiClient.post('/payroll-runs', payload);
    return data;
  },
  
  async getPayrollRun(payrollRunId) {
    const { data } = await apiClient.get(`/payroll-runs/${payrollRunId}`);
    return data;
  },
  
  async updatePayrollRun(payrollRunId, payload) {
    const { data } = await apiClient.patch(`/payroll-runs/${payrollRunId}`, payload);
    return data;
  },
  
  async deletePayrollRun(payrollRunId) {
    await apiClient.delete(`/payroll-runs/${payrollRunId}`);
  },
  
  async processPayrollRun(payrollRunId) {
    const { data } = await apiClient.post(`/payroll-runs/${payrollRunId}/process`);
    return data;
  },
  
  async calculatePayrollRun(payrollRunId) {
    const { data } = await apiClient.post(`/payroll-runs/${payrollRunId}/calculate`);
    return data;
  },
  
  async approvePayrollRun(payrollRunId) {
    const { data } = await apiClient.post(`/payroll-runs/${payrollRunId}/approve`);
    return data;
  },
  
  async markPayrollRunAsPaid(payrollRunId) {
    const { data } = await apiClient.post(`/payroll-runs/${payrollRunId}/mark-paid`);
    return data;
  },
  
  async getPayrollRunsSummary() {
    const { data } = await apiClient.get('/payroll-runs/summary');
    return data;
  },
  
  async getPendingPayrollRuns() {
    const { data } = await apiClient.get('/payroll-runs/pending');
    return data;
  },
  
  async getPayrollRunsByBranch(branchId) {
    const { data } = await apiClient.get(`/payroll-runs/branch/${branchId}`);
    return data;
  },
  
  async getPayrollRunsByPeriod(payrollPeriodId) {
    const { data } = await apiClient.get(`/payroll-runs/period/${payrollPeriodId}`);
    return data;
  },

  // Payroll Items
  async listPayrollItems({ payroll_run_id, employee_id, payroll_period_id, status, page } = {}) {
    const { data } = await apiClient.get('/payroll-items', { 
      params: { 
        payroll_run_id, 
        employee_id, 
        payroll_period_id,
        status, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createPayrollItem(payload) {
    const { data } = await apiClient.post('/payroll-items', payload);
    return data;
  },
  
  async bulkCreatePayrollItems(payload) {
    const { data } = await apiClient.post('/payroll-items/bulk', payload);
    return data;
  },
  
  async getPayrollItem(payrollItemId) {
    const { data } = await apiClient.get(`/payroll-items/${payrollItemId}`);
    return data;
  },
  
  async updatePayrollItem(payrollItemId, payload) {
    const { data } = await apiClient.patch(`/payroll-items/${payrollItemId}`, payload);
    return data;
  },
  
  async deletePayrollItem(payrollItemId) {
    await apiClient.delete(`/payroll-items/${payrollItemId}`);
  },
  
  async addAllowanceToPayrollItem(payrollItemId, payload) {
    const { data } = await apiClient.post(`/payroll-items/${payrollItemId}/allowances`, payload);
    return data;
  },
  
  async addDeductionToPayrollItem(payrollItemId, payload) {
    const { data } = await apiClient.post(`/payroll-items/${payrollItemId}/deductions`, payload);
    return data;
  },
  
  async removeAllowanceFromPayrollItem(payrollItemId, allowanceId) {
    await apiClient.delete(`/payroll-items/${payrollItemId}/allowances/${allowanceId}`);
  },
  
  async removeDeductionFromPayrollItem(payrollItemId, deductionId) {
    await apiClient.delete(`/payroll-items/${payrollItemId}/deductions/${deductionId}`);
  },
  
  async getPayrollItemsByRun(payrollRunId) {
    const { data } = await apiClient.get(`/payroll-items/run/${payrollRunId}`);
    return data;
  },
  
  async getPayrollItemsByEmployee(employeeId) {
    const { data } = await apiClient.get(`/payroll-items/employee/${employeeId}`);
    return data;
  },
  
  async getPayrollItemsSummary(payrollRunId) {
    const { data } = await apiClient.get(`/payroll-items/summary/${payrollRunId}`);
    return data;
  },

  // Salary Structures
  async listSalaryStructures({ branch_id, department_id, is_active, page } = {}) {
    const { data } = await apiClient.get('/salary-structures', { 
      params: { 
        branch_id, 
        department_id, 
        is_active, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createSalaryStructure(payload) {
    const { data } = await apiClient.post('/salary-structures', payload);
    return data;
  },
  
  async getSalaryStructure(salaryStructureId) {
    const { data } = await apiClient.get(`/salary-structures/${salaryStructureId}`);
    return data;
  },
  
  async updateSalaryStructure(salaryStructureId, payload) {
    const { data } = await apiClient.patch(`/salary-structures/${salaryStructureId}`, payload);
    return data;
  },
  
  async deleteSalaryStructure(salaryStructureId) {
    await apiClient.delete(`/salary-structures/${salaryStructureId}`);
  },
  
  async assignSalaryStructureToEmployee(salaryStructureId, payload) {
    const { data } = await apiClient.post(`/salary-structures/${salaryStructureId}/assign-employee`, payload);
    return data;
  },
  
  async getActiveSalaryStructures() {
    const { data } = await apiClient.get('/salary-structures/active');
    return data;
  },
  
  async getSalaryStructuresByDepartment(departmentId) {
    const { data } = await apiClient.get(`/salary-structures/department/${departmentId}`);
    return data;
  },

  // Allowances
  async listAllowances({ branch_id, is_active, is_taxable, page } = {}) {
    const { data } = await apiClient.get('/allowances', { 
      params: { 
        branch_id, 
        is_active, 
        is_taxable, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createAllowance(payload) {
    const { data } = await apiClient.post('/allowances', payload);
    return data;
  },
  
  async getAllowance(allowanceId) {
    const { data } = await apiClient.get(`/allowances/${allowanceId}`);
    return data;
  },
  
  async updateAllowance(allowanceId, payload) {
    const { data } = await apiClient.patch(`/allowances/${allowanceId}`, payload);
    return data;
  },
  
  async deleteAllowance(allowanceId) {
    await apiClient.delete(`/allowances/${allowanceId}`);
  },
  
  async getActiveAllowances() {
    const { data } = await apiClient.get('/allowances/active');
    return data;
  },
  
  async getTaxableAllowances() {
    const { data } = await apiClient.get('/allowances/taxable');
    return data;
  },
  
  async getNonTaxableAllowances() {
    const { data } = await apiClient.get('/allowances/non-taxable');
    return data;
  },

  // Deductions
  async listDeductions({ branch_id, is_active, deduction_type, page } = {}) {
    const { data } = await apiClient.get('/deductions', { 
      params: { 
        branch_id, 
        is_active, 
        deduction_type, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createDeduction(payload) {
    const { data } = await apiClient.post('/deductions', payload);
    return data;
  },
  
  async getDeduction(deductionId) {
    const { data } = await apiClient.get(`/deductions/${deductionId}`);
    return data;
  },
  
  async updateDeduction(deductionId, payload) {
    const { data } = await apiClient.patch(`/deductions/${deductionId}`, payload);
    return data;
  },
  
  async deleteDeduction(deductionId) {
    await apiClient.delete(`/deductions/${deductionId}`);
  },
  
  async getActiveDeductions() {
    const { data } = await apiClient.get('/deductions/active');
    return data;
  },
  
  async getDeductionsByType(type) {
    const { data } = await apiClient.get(`/deductions/type/${type}`);
    return data;
  },
  
  async getTaxDeductions() {
    const { data } = await apiClient.get('/deductions/tax');
    return data;
  },
  
  async getPensionDeductions() {
    const { data } = await apiClient.get('/deductions/pension');
    return data;
  },
  
  async getLoanDeductions() {
    const { data } = await apiClient.get('/deductions/loans');
    return data;
  },
  
  async getAdvanceDeductions() {
    const { data } = await apiClient.get('/deductions/advances');
    return data;
  },

  // Employee Salary Structures
  async listEmployeeSalaryStructures({ employee_id, salary_structure_id, is_active, page } = {}) {
    const { data } = await apiClient.get('/employee-salary-structures', { 
      params: { 
        employee_id, 
        salary_structure_id, 
        is_active, 
        page,
        per_page: 20 
      } 
    });
    return data;
  },
  
  async createEmployeeSalaryStructure(payload) {
    const { data } = await apiClient.post('/employee-salary-structures', payload);
    return data;
  },
  
  async getEmployeeSalaryStructure(employeeSalaryStructureId) {
    const { data } = await apiClient.get(`/employee-salary-structures/${employeeSalaryStructureId}`);
    return data;
  },
  
  async updateEmployeeSalaryStructure(employeeSalaryStructureId, payload) {
    const { data } = await apiClient.patch(`/employee-salary-structures/${employeeSalaryStructureId}`, payload);
    return data;
  },
  
  // Salary Structures
  async listSalaryStructures(params = {}) {
    const { data } = await apiClient.get('/salary-structures', { params });
    return data;
  },
  
  async getActiveSalaryStructures() {
    const { data } = await apiClient.get('/salary-structures/active');
    return data;
  },

  async getSalaryStructure(id) {
    const { data } = await apiClient.get(`/salary-structures/${id}`);
    return data;
  },

  async createSalaryStructure(payload) {
    const { data } = await apiClient.post('/salary-structures', payload);
    return data;
  },

  async updateSalaryStructure(id, payload) {
    const { data } = await apiClient.patch(`/salary-structures/${id}`, payload);
    return data;
  },

  async deleteSalaryStructure(id) {
    await apiClient.delete(`/salary-structures/${id}`);
  },

  async deleteEmployeeSalaryStructure(employeeSalaryStructureId) {
    await apiClient.delete(`/employee-salary-structures/${employeeSalaryStructureId}`);
  },
  
  async getCurrentEmployeeSalaryStructure(employeeId) {
    const { data } = await apiClient.get(`/employee-salary-structures/employee/${employeeId}/current`);
    return data;
  },
  
  async getEmployeeSalaryStructureHistory(employeeId) {
    const { data } = await apiClient.get(`/employee-salary-structures/employee/${employeeId}/history`);
    return data;
  },

  // Employee Payroll Profiles (for Employee Payroll section)
  async getEmployeePayrollProfiles({ branch_id, department_id, search, page } = {}) {
    const { data } = await apiClient.get('/employees/payroll-profiles', {
      params: {
        branch_id,
        department_id,
        search,
        page,
        per_page: 20
      }
    });
    return data;
  },

  // ─── Employee Payroll Workflow (Per-Employee) ────────────────────
  async getEmployeePayrollList(params = {}) {
    const { data } = await apiClient.get('/employee-payroll/list', { params });
    return data;
  },

  async getEmployeePayrollDetail(employeeId, params = {}) {
    const { data } = await apiClient.get(`/employee-payroll/${employeeId}/detail`, { params });
    return data;
  },

  async getEmployeeAttendance(employeeId, params = {}) {
    const { data } = await apiClient.get(`/employee-payroll/${employeeId}/attendance`, { params });
    return data;
  },

  async calculateEmployeeSalary(employeeId, payload) {
    const { data } = await apiClient.post(`/employee-payroll/${employeeId}/calculate`, payload);
    return data;
  },

  async calculateEmployeeDeductions(employeeId, payload) {
    const { data } = await apiClient.post(`/employee-payroll/${employeeId}/calculate-deductions`, payload);
    return data;
  },

  async confirmEmployeeReview(employeeId, payload) {
    const { data } = await apiClient.post(`/employee-payroll/${employeeId}/confirm-review`, payload);
    return data;
  },

  async approveEmployeePayroll(employeeId, payload) {
    const { data } = await apiClient.post(`/employee-payroll/${employeeId}/approve`, payload);
    return data;
  },

  async processEmployeePayment(employeeId, payload) {
    const { data } = await apiClient.post(`/employee-payroll/${employeeId}/pay`, payload);
    return data;
  },

  async getEmployeePayslip(employeeId, params = {}) {
    const { data } = await apiClient.get(`/employee-payroll/${employeeId}/payslip`, { params });
    return data;
  },

  async getEmployeeReceipt(employeeId, params = {}) {
    const { data } = await apiClient.get(`/employee-payroll/${employeeId}/receipt`, { params });
    return data;
  },
};