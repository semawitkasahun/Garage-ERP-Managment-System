import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Download, Printer, FileSpreadsheet, FileText, 
  Filter, Calendar, Users, DollarSign, TrendingUp, CreditCard,
  ChevronDown, Search, X, ArrowRight, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { payrollApi } from '@/features/payroll/api/payrollApi';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/Toast';

const REPORT_TYPES = [
  { id: 'summary', label: 'Payroll Summary', icon: BarChart3 },
  { id: 'employee', label: 'Employee Payroll', icon: Users },
  { id: 'deduction', label: 'Deduction Report', icon: TrendingUp },
  { id: 'payment', label: 'Payment Report', icon: CreditCard },
  { id: 'period', label: 'Payroll Period Report', icon: Calendar },
];

const STATUS_STYLES = {
  paid: { bg: 'hsl(145 35% 93%)', text: 'hsl(145 45% 30%)' },
  pending: { bg: 'hsl(30 50% 90%)', text: 'hsl(30 50% 35%)' },
  approved: { bg: 'hsl(200 35% 93%)', text: 'hsl(200 45% 30%)' },
};

export function PayrollReportsPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [activeReport, setActiveReport] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    payroll_period_id: 'all',
    month: '',
    year: '',
    employee_id: 'all',
    department_id: 'all',
    job_title: 'all',
    payment_status: 'all',
    start_date: '',
    end_date: '',
  });
  
  // Data for dropdowns
  const [periods, setPeriods] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Load initial data
  useEffect(() => {
    loadFilterData();
  }, []);
  
  const loadFilterData = async () => {
    try {
      const [periodsData, employeesData] = await Promise.all([
        payrollApi.listPayrollPeriods({ per_page: 100 }),
        payrollApi.getEmployeePayrollProfiles({ per_page: 100 })
      ]);
      setPeriods(periodsData?.data || []);
      setEmployees(employeesData?.data || []);
      
      // Extract unique departments
      const uniqueDepts = [...new Set(employeesData?.data?.map(e => e.department?.name).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };
  
  const hasPermission = (permission) => {
    const role = user?.role?.toLowerCase();
    if (permission === 'finance') {
      return ['owner', 'admin', 'finance', 'hr manager'].includes(role);
    }
    if (permission === 'hr') {
      return ['owner', 'admin', 'hr', 'hr manager', 'supervisor'].includes(role);
    }
    return true;
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };
  
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const handleGenerateReport = async () => {
    // Permission check is handled by the router ProtectedRoute
    
    setLoading(true);
    try {
      const params = {
        ...filters,
        payroll_period_id: filters.payroll_period_id === 'all' ? undefined : filters.payroll_period_id,
        employee_id: filters.employee_id === 'all' ? undefined : filters.employee_id,
        department_id: filters.department_id === 'all' ? undefined : filters.department_id,
        job_title: filters.job_title === 'all' ? undefined : filters.job_title,
        payment_status: filters.payment_status === 'all' ? undefined : filters.payment_status,
      };
      
      const data = await payrollApi.getComprehensiveReport(params);
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportPDF = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }
    
    // Create a simple PDF export using browser's print functionality
    // In production, you would use a library like jsPDF or react-pdf
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #5E6945; margin-bottom: 10px;">Payroll Reports</h1>
        <h2 style="color: #333; margin-bottom: 20px;">${REPORT_TYPES.find(r => r.id === activeReport)?.label}</h2>
        <div style="margin-bottom: 20px;">
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Report Type:</strong> ${REPORT_TYPES.find(r => r.id === activeReport)?.label}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #5E6945; color: white;">
              ${getTableHeaders().map(header => `<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${getTableRows().map(row => `
              <tr style="border-bottom: 1px solid #ddd;">
                ${row.map(cell => `<td style="padding: 10px; border: 1px solid #ddd;">${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent.innerHTML);
    printWindow.document.close();
    printWindow.print();
    toast.success('PDF export initiated');
  };
  
  const handleExportExcel = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }
    
    // Create CSV content
    const headers = getTableHeaders();
    const rows = getTableRows();
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll-report-${activeReport}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel export successful');
  };
  
  const handlePrint = () => {
    if (!reportData) {
      toast.error('Please generate a report first');
      return;
    }
    window.print();
  };
  
  const getTableHeaders = () => {
    switch (activeReport) {
      case 'summary':
        return ['Payroll Period', 'Employee Count', 'Gross Salary', 'Total Deductions', 'Net Salary', 'Amount Paid', 'Amount Pending'];
      case 'employee':
        return ['Employee Name', 'Job Title', 'Basic Salary', 'Allowances', 'Gross Salary', 'Deductions', 'Net Salary', 'Payment Status'];
      case 'deduction':
        return ['Employee', 'Gross Salary', 'Tax', 'Pension', 'Other Deductions', 'Total Deductions'];
      case 'payment':
        return ['Employee', 'Period', 'Net Salary', 'Payment Method', 'Payment Date', 'Payment Reference', 'Status'];
      case 'period':
        return ['Period', 'Start Date', 'End Date', 'Employees', 'Gross Payroll', 'Deductions', 'Net Payroll', 'Paid Amount', 'Status'];
      default:
        return [];
    }
  };
  
  const getTableRows = () => {
    switch (activeReport) {
      case 'summary':
        return (reportData.payroll_summary || []).map(period => [
          period.period_name,
          period.employee_count,
          formatCurrency(period.gross_salary),
          formatCurrency(period.total_deductions),
          formatCurrency(period.net_salary),
          formatCurrency(period.amount_paid),
          formatCurrency(period.amount_pending)
        ]);
      case 'employee':
        return (reportData.employee_report || []).map(emp => [
          emp.employee_name,
          emp.job_title,
          formatCurrency(emp.basic_salary),
          formatCurrency(emp.allowances),
          formatCurrency(emp.gross_salary),
          formatCurrency(emp.deductions),
          formatCurrency(emp.net_salary),
          emp.payment_status
        ]);
      case 'deduction':
        return (reportData.deduction_report || []).map(ded => [
          ded.employee_name,
          formatCurrency(ded.gross_salary),
          formatCurrency(ded.tax),
          formatCurrency(ded.pension),
          formatCurrency(ded.other_deductions),
          formatCurrency(ded.total_deductions)
        ]);
      case 'payment':
        return (reportData.payment_report || []).map(pay => [
          pay.employee_name,
          pay.period_name,
          formatCurrency(pay.net_salary),
          pay.payment_method,
          formatDate(pay.payment_date),
          pay.payment_reference,
          pay.status
        ]);
      case 'period':
        return (reportData.period_report || []).map(per => [
          per.period_name,
          formatDate(per.start_date),
          formatDate(per.end_date),
          per.employee_count,
          formatCurrency(per.gross_salary),
          formatCurrency(per.total_deductions),
          formatCurrency(per.net_salary),
          formatCurrency(per.amount_paid),
          per.status
        ]);
      default:
        return [];
    }
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      payroll_period_id: 'all',
      month: '',
      year: '',
      employee_id: 'all',
      department_id: 'all',
      job_title: 'all',
      payment_status: 'all',
      start_date: '',
      end_date: '',
    });
    setReportData(null);
  };
  
  const renderSummaryCards = () => {
    if (!reportData) return null;
    
    const summary = reportData.summary || {};
    const cards = [
      { label: 'Total Employees', value: summary.total_employees || 0, icon: Users, color: 'hsl(84 30% 28%)' },
      { label: 'Gross Payroll', value: formatCurrency(summary.gross_payroll || 0), icon: DollarSign, color: 'hsl(200 50% 30%)' },
      { label: 'Total Deductions', value: formatCurrency(summary.total_deductions || 0), icon: TrendingUp, color: 'hsl(30 50% 35%)' },
      { label: 'Net Payroll', value: formatCurrency(summary.net_payroll || 0), icon: CreditCard, color: 'hsl(145 45% 30%)' },
      { label: 'Total Paid', value: formatCurrency(summary.total_paid || 0), icon: CheckCircle, color: 'hsl(145 45% 30%)' },
      { label: 'Pending Payments', value: formatCurrency(summary.pending_payments || 0), icon: Clock, color: 'hsl(30 50% 35%)' },
    ];
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: `${card.color}20` }}>
                  <Icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <p className="font-display text-2xl font-bold tracking-tight">
                {loading ? <Skeleton className="h-8 w-20 inline-block" /> : card.value}
              </p>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderReportTable = () => {
    if (!reportData) return null;
    
    switch (activeReport) {
      case 'summary':
        return renderSummaryReport();
      case 'employee':
        return renderEmployeeReport();
      case 'deduction':
        return renderDeductionReport();
      case 'payment':
        return renderPaymentReport();
      case 'period':
        return renderPeriodReport();
      default:
        return null;
    }
  };
  
  const renderSummaryReport = () => {
    const periods = reportData.payroll_summary || [];
    
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/20 text-left">
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Payroll Period</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Employee Count</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Gross Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Total Deductions</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Net Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Amount Paid</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Amount Pending</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => (
                <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{period.period_name}</td>
                  <td className="px-5 py-3.5 text-center">{period.employee_count || '—'}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">{formatCurrency(period.gross_salary || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(period.total_deductions || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatCurrency(period.net_salary || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-emerald-700">{formatCurrency(period.amount_paid || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-amber-600">{formatCurrency(period.amount_pending || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderEmployeeReport = () => {
    const employees = reportData.employee_report || [];
    
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/20 text-left">
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Employee Name</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Job Title</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Basic Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Allowances</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Gross Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Deductions</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Net Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((item, index) => {
                const statusStyle = item.payment_status === 'paid' ? STATUS_STYLES.paid : 
                                   item.payment_status === 'pending' ? STATUS_STYLES.pending : STATUS_STYLES.approved;
                return (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{item.employee_name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{item.job_title || '—'}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{formatCurrency(item.basic_salary || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{formatCurrency(item.allowances || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{formatCurrency(item.gross_salary || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(item.deductions || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatCurrency(item.net_salary || 0)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {item.payment_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderDeductionReport = () => {
    const deductions = reportData.deduction_report || [];
    
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/20 text-left">
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Employee</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Gross Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Tax</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Pension</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Other Deductions</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Total Deductions</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map((item, index) => (
                <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{item.employee_name}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">{formatCurrency(item.gross_salary || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(item.tax || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(item.pension || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(item.other_deductions || 0)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums font-medium text-amber-700">{formatCurrency(item.total_deductions || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderPaymentReport = () => {
    const payments = reportData.payment_report || [];
    
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/20 text-left">
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Employee</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Period</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Net Salary</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Payment Method</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Payment Date</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Payment Reference</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment, index) => {
                const statusStyle = payment.status === 'paid' ? STATUS_STYLES.paid : STATUS_STYLES.pending;
                return (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{payment.employee_name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{payment.period_name}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatCurrency(payment.net_salary || 0)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">{payment.payment_method || '—'}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(payment.payment_date)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{payment.payment_reference || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderPeriodReport = () => {
    const periods = reportData.period_report || [];
    
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/20 text-left">
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Period</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Start Date</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">End Date</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Employees</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Gross Payroll</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Deductions</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Net Payroll</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium text-right">Paid Amount</th>
                <th className="px-5 py-3 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => {
                const statusStyle = period.status === 'paid' ? STATUS_STYLES.paid : 
                                   period.status === 'pending' ? STATUS_STYLES.pending : STATUS_STYLES.approved;
                return (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{period.period_name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(period.start_date)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{formatDate(period.end_date)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{period.employee_count || 0}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums">{formatCurrency(period.gross_salary || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-amber-700">{formatCurrency(period.total_deductions || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatCurrency(period.net_salary || 0)}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-emerald-700">{formatCurrency(period.amount_paid || 0)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                        {period.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // Permission check is handled by the router ProtectedRoute
  // Remove component-level check to avoid conflicts
  
  const navSections = getNavSections(user?.role);
  
  return (
    <DashboardLayout navSections={navSections} pageTitle="Payroll Reports" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight">Payroll Reports</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Generate and view comprehensive payroll summaries and reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-accent/30 transition-colors"
              disabled={!reportData}
            >
              <FileText className="h-4 w-4" /> Export PDF
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-accent/30 transition-colors"
              disabled={!reportData}
            >
              <FileSpreadsheet className="h-4 w-4" /> Export Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-border hover:bg-accent/30 transition-colors"
              disabled={!reportData}
            >
              <Printer className="h-4 w-4" /> Print
            </button>
          </div>
        </div>
        
        {/* Report Type Selector */}
        <div className="flex items-center gap-2 p-1 rounded-lg border border-border bg-card">
          {REPORT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setActiveReport(type.id);
                  setReportData(null);
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeReport === type.id
                    ? 'text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
                style={activeReport === type.id ? { background: 'hsl(84 25% 30%)' } : {}}
              >
                <Icon className="h-4 w-4" />
                {type.label}
              </button>
            );
          })}
        </div>
        
        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Filters</h3>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Payroll Period */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Payroll Period</label>
              <select
                value={filters.payroll_period_id}
                onChange={(e) => handleFilterChange('payroll_period_id', e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Periods</option>
                {periods.map((period) => (
                  <option key={period.payroll_period_id} value={period.payroll_period_id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Month */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Month</label>
              <input
                type="month"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              />
            </div>
            
            {/* Employee */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Employee</label>
              <select
                value={filters.employee_id}
                onChange={(e) => handleFilterChange('employee_id', e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || `${emp.first_name} ${emp.last_name}`}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Department */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Department</label>
              <select
                value={filters.department_id}
                onChange={(e) => handleFilterChange('department_id', e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Job Title */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Job Title</label>
              <select
                value={filters.job_title}
                onChange={(e) => handleFilterChange('job_title', e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Titles</option>
                {[...new Set(employees.map(e => e.job_title).filter(Boolean))].map((title, index) => (
                  <option key={index} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Payment Status */}
            <div>
              <label className="block text-xs font-medium mb-1.5">Payment Status</label>
              <select
                value={filters.payment_status}
                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        {renderSummaryCards()}
        
        {/* Report Table */}
        {reportData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                {REPORT_TYPES.find(r => r.id === activeReport)?.label}
              </h3>
              <span className="text-sm text-muted-foreground">
                {reportData.payroll_summary?.length || reportData.employee_report?.length || reportData.deduction_report?.length || reportData.payment_report?.length || reportData.period_report?.length || 0} record(s)
              </span>
            </div>
            {renderReportTable()}
          </div>
        )}
        
        {/* Empty State */}
        {!reportData && !loading && (
          <div className="rounded-xl border border-border bg-card p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
              <h3 className="font-display text-lg font-semibold mb-2">No Report Generated</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Select your desired report type and apply filters to generate a comprehensive payroll report.
              </p>
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 shadow-sm"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                <BarChart3 className="h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}