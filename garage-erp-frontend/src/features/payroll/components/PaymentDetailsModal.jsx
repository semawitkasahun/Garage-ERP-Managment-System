import { useState } from 'react';
import { X, FileText, Printer, Download, CreditCard, CheckCircle, Calendar, User, DollarSign, ArrowRight } from 'lucide-react';
import { useEmployeePayslip, useEmployeeReceipt } from '@/features/payroll/hooks/usePayroll';
import { PayslipDocument } from './PayslipDocument';
import { PaymentReceipt } from './PaymentReceipt';

export function PaymentDetailsModal({ open, onClose, payment }) {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'payslip' | 'receipt'

  const employeeId = payment?.employee_id;
  const periodId = payment?.period_id;

  const { data: payslipData, isLoading: payslipLoading } = useEmployeePayslip(employeeId, {
    payroll_period_id: periodId,
    enabled: !!open && !!employeeId && !!periodId && (activeTab === 'payslip' || activeTab === 'details'),
  });

  const { data: receiptData, isLoading: receiptLoading } = useEmployeeReceipt(employeeId, {
    payroll_period_id: periodId,
    enabled: !!open && !!employeeId && !!periodId && (activeTab === 'receipt' || activeTab === 'details'),
  });

  if (!open || !payment) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency', currency: 'ETB', minimumFractionDigits: 2
    }).format(val || 0);
  };

  const methodLabel = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    other: 'Other'
  }[payment.payment_method] || payment.payment_method || 'Bank Transfer';

  const handlePrintWindow = (elementId, title) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #111; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${el.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl bg-white border border-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-accent/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'hsl(84 20% 90%)' }}>
              <CreditCard className="h-5 w-5" style={{ color: 'hsl(84 30% 28%)' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-semibold">{payment.employee_name}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-accent/40 text-muted-foreground">
                  {payment.employee_code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Payment Record · {payment.payment_reference || payment.receipt_number || `PAY-${payment.payroll_payment_id}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-border bg-card">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === 'details' ? { borderColor: 'hsl(84 25% 30%)', color: 'hsl(84 25% 30%)' } : {}}
          >
            <User className="h-3.5 w-3.5" /> Payment Summary
          </button>
          <button
            onClick={() => setActiveTab('payslip')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'payslip'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === 'payslip' ? { borderColor: 'hsl(84 25% 30%)', color: 'hsl(84 25% 30%)' } : {}}
          >
            <FileText className="h-3.5 w-3.5" /> View Payslip
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'receipt'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === 'receipt' ? { borderColor: 'hsl(84 25% 30%)', color: 'hsl(84 25% 30%)' } : {}}
          >
            <CheckCircle className="h-3.5 w-3.5" /> View Receipt
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Payment Completed</p>
                    <p className="text-xs text-emerald-700">Processed on {payment.payment_date} via {methodLabel}</p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-emerald-600 text-white shadow-sm">
                  {payment.status || 'Paid'}
                </span>
              </div>

              {/* Grid Information Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h3 className="font-display text-sm font-semibold text-foreground border-b border-border pb-2">
                  Payment & Payroll Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Employee Name</span>
                    <span className="font-semibold text-foreground">{payment.employee_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Position / Title</span>
                    <span className="font-medium text-foreground">{payment.job_title}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Payroll Period</span>
                    <span className="font-semibold text-foreground">{payment.period_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Period Range</span>
                    <span className="font-mono text-muted-foreground">{payment.period_start} → {payment.period_end}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Gross Salary</span>
                    <span className="font-medium text-foreground">{formatCurrency(payment.gross_salary)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Total Deductions</span>
                    <span className="font-medium text-amber-700">-{formatCurrency(payment.total_deductions)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50 bg-accent/20 px-2 rounded-md font-bold">
                    <span className="text-foreground">Net Salary Paid</span>
                    <span className="text-emerald-700 text-sm">{formatCurrency(payment.net_salary)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-medium text-foreground">{methodLabel}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Payment Date</span>
                    <span className="font-mono text-foreground">{payment.payment_date}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Payment Reference</span>
                    <span className="font-mono font-medium text-foreground">{payment.payment_reference}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar inside details */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('payslip')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Payslip
                  </button>
                  <button
                    onClick={() => setActiveTab('receipt')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-accent/40 transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> View Receipt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYSLIP */}
          {activeTab === 'payslip' && (
            <div>
              {payslipLoading ? (
                <div className="p-8 text-center space-y-3">
                  <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading payslip document...</p>
                </div>
              ) : payslipData ? (
                <PayslipDocument data={payslipData} />
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Payslip data unavailable for this payment.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECEIPT */}
          {activeTab === 'receipt' && (
            <div>
              {receiptLoading ? (
                <div className="p-8 text-center space-y-3">
                  <div className="inline-block h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">Loading receipt document...</p>
                </div>
              ) : receiptData ? (
                <PaymentReceipt data={receiptData} />
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Receipt data unavailable for this payment.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-accent/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-accent/30 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
