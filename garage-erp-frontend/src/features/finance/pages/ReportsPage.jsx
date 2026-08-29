import { useState } from 'react';
import { BarChart3, FileText, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useReports } from '../hooks/useFinance';

const REPORT_TYPES = [
  { value: 'profit_loss', label: 'Profit & Loss' },
  { value: 'income', label: 'Income Report' },
  { value: 'expense', label: 'Expense Report' },
  { value: 'receivables', label: 'Customer Outstanding Balances' },
  { value: 'payables', label: 'Supplier Outstanding Balances' },
  { value: 'payroll', label: 'Payroll Cost Report' },
  { value: 'cash_bank', label: 'Cash & Bank Report' },
  { value: 'transactions', label: 'Financial Transactions Report' },
];

const DATE_PRESETS = [
  { label: 'Today', getValue: () => { const d = new Date().toISOString().split('T')[0]; return { from: d, to: d }; } },
  { label: 'This Week', getValue: () => { const n = new Date(); const s = new Date(n); s.setDate(n.getDate() - n.getDay()); return { from: s.toISOString().split('T')[0], to: n.toISOString().split('T')[0] }; } },
  { label: 'This Month', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split('T')[0], to: n.toISOString().split('T')[0] }; } },
  { label: 'This Year', getValue: () => { const n = new Date(); return { from: new Date(n.getFullYear(), 0, 1).toISOString().split('T')[0], to: n.toISOString().split('T')[0] }; } },
];

export function ReportsPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);

  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [reportType, setReportType] = useState('profit_loss');
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [generated, setGenerated] = useState(false);

  const { data, isLoading, refetch } = useReports(
    generated ? { type: reportType, from_date: fromDate, to_date: toDate } : {}
  );

  const handleGenerate = () => {
    setGenerated(true);
    refetch();
  };

  const handlePrint = () => window.print();

  const fmt = (v) => parseFloat(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const renderProfitLoss = (d) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-emerald-700" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Total Income</span>
          </div>
          <p className="font-display text-2xl font-bold text-emerald-700">ETB {fmt(d.income)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-red-600 font-bold">Total Expenses</span>
          </div>
          <p className="font-display text-2xl font-bold text-red-600">ETB {fmt(d.expenses?.total)}</p>
        </div>
        <div className={`rounded-xl border p-5 ${d.net_profit >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className={`h-5 w-5 ${d.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`} />
            <span className={`font-mono text-[10px] uppercase tracking-wider font-bold ${d.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>Net Profit</span>
          </div>
          <p className={`font-display text-2xl font-bold ${d.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>ETB {fmt(d.net_profit)}</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <h4 className="font-display text-sm font-semibold">Expense Breakdown</h4>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {[
              { label: 'Supplier Purchases', val: d.expenses?.purchases },
              { label: 'Payroll / Salaries', val: d.expenses?.payroll },
              { label: 'Operating Expenses', val: d.expenses?.operating_expenses },
            ].map(row => (
              <tr key={row.label} className="hover:bg-muted/20">
                <td className="px-5 py-3 text-muted-foreground">{row.label}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">ETB {fmt(row.val)}</td>
              </tr>
            ))}
            <tr className="bg-muted/30 font-bold">
              <td className="px-5 py-3 text-foreground">Total Expenses</td>
              <td className="px-5 py-3 text-right text-red-600">ETB {fmt(d.expenses?.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTableReport = (rows, columns) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              {columns.map(col => (
                <th key={col.key} className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(!rows || rows.length === 0) ? (
              <tr><td colSpan={columns.length} className="px-5 py-8 text-center text-muted-foreground">No data for this period.</td></tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  {columns.map(col => (
                    <td key={col.key} className={`px-5 py-3.5 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReport = () => {
    if (!data || !generated) return null;
    const d = data.data;

    switch (reportType) {
      case 'profit_loss': return renderProfitLoss(d);
      case 'income':
        return renderTableReport(Array.isArray(d) ? d : [], [
          { key: 'sale_number', label: 'Sale #' },
          { key: 'customer', label: 'Customer', render: row => `${row.customer?.first_name ?? ''} ${row.customer?.last_name ?? ''}`.trim() || '—' },
          { key: 'sale_date', label: 'Date', render: row => row.sale_date ? new Date(row.sale_date).toLocaleDateString() : '—' },
          { key: 'total_amount', label: 'Total', render: row => `ETB ${fmt(row.total_amount)}`, className: 'font-semibold' },
          { key: 'amount_paid', label: 'Paid', render: row => `ETB ${fmt(row.amount_paid)}`, className: 'text-emerald-700 font-semibold' },
          { key: 'payment_status', label: 'Status', render: row => <span className="capitalize">{row.payment_status}</span> },
        ]);
      case 'expense':
        return renderTableReport(Array.isArray(d) ? d : [], [
          { key: 'date', label: 'Date', render: row => row.date ? new Date(row.date).toLocaleDateString() : '—' },
          { key: 'category', label: 'Category' },
          { key: 'description', label: 'Description' },
          { key: 'reference', label: 'Reference', className: 'font-mono text-xs text-muted-foreground' },
          { key: 'amount', label: 'Amount', render: row => `ETB ${fmt(row.amount)}`, className: 'text-rose-600 font-semibold' },
        ]);
      case 'receivables':
        return renderTableReport(Array.isArray(d) ? d : [], [
          { key: 'customer', label: 'Customer', render: row => `${row.customer?.first_name ?? ''} ${row.customer?.last_name ?? ''}`.trim() || '—' },
          { key: 'sale_number', label: 'Sale #' },
          { key: 'total_amount', label: 'Total', render: row => `ETB ${fmt(row.total_amount)}`, className: 'font-semibold' },
          { key: 'amount_paid', label: 'Paid', render: row => `ETB ${fmt(row.amount_paid)}`, className: 'text-emerald-700 font-semibold' },
          { key: 'balance', label: 'Balance Due', render: row => `ETB ${fmt(parseFloat(row.total_amount) - parseFloat(row.amount_paid))}`, className: 'text-rose-600 font-bold' },
          { key: 'payment_status', label: 'Status', render: row => <span className="capitalize">{row.payment_status}</span> },
        ]);
      case 'payables':
        return renderTableReport(Array.isArray(d) ? d : [], [
          { key: 'supplier', label: 'Supplier', render: row => row.supplier?.name || '—' },
          { key: 'purchase_number', label: 'Purchase #' },
          { key: 'total_amount', label: 'Total', render: row => `ETB ${fmt(row.total_amount)}`, className: 'font-semibold' },
          { key: 'amount_paid', label: 'Paid', render: row => `ETB ${fmt(row.amount_paid)}`, className: 'text-emerald-700 font-semibold' },
          { key: 'balance', label: 'Balance Due', render: row => `ETB ${fmt(parseFloat(row.total_amount) - parseFloat(row.amount_paid))}`, className: 'text-amber-600 font-bold' },
          { key: 'payment_status', label: 'Status', render: row => <span className="capitalize">{row.payment_status}</span> },
        ]);
      case 'payroll':
        return renderTableReport(Array.isArray(d) ? d : [], [
          { key: 'employee', label: 'Employee', render: row => `${row.employee?.first_name ?? ''} ${row.employee?.last_name ?? ''}`.trim() || '—' },
          { key: 'payment_date', label: 'Date', render: row => row.payment_date ? new Date(row.payment_date).toLocaleDateString() : '—' },
          { key: 'amount', label: 'Amount', render: row => `ETB ${fmt(row.amount)}`, className: 'text-rose-600 font-semibold' },
          { key: 'payment_method', label: 'Method', className: 'capitalize text-muted-foreground' },
          { key: 'receipt_number', label: 'Receipt #', className: 'font-mono text-xs text-muted-foreground' },
        ]);
      case 'cash_bank':
      case 'transactions':
        return renderTableReport(Array.isArray(d) ? d : [], [
          { key: 'transaction_date', label: 'Date', render: row => row.transaction_date ? new Date(row.transaction_date).toLocaleDateString() : '—' },
          { key: 'description', label: 'Description', className: 'font-semibold' },
          { key: 'type', label: 'Type', render: row => <span className="capitalize">{row.type?.replace('_', ' ')}</span> },
          { key: 'account', label: 'Account', className: 'capitalize text-muted-foreground' },
          { key: 'amount', label: 'Amount', render: row => `ETB ${fmt(row.amount)}`, className: 'font-bold text-foreground' },
          { key: 'reference_type', label: 'Source', render: row => row.reference_type ? <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-muted rounded border border-border">{row.reference_type.replace('_', ' ')}</span> : '—' },
        ]);
      default:
        return <p className="text-muted-foreground text-sm">Unsupported report type.</p>;
    }
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Financial Reports" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">

        {/* Report Configuration Panel */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold text-foreground">Configure Report</h3>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={e => { setReportType(e.target.value); setGenerated(false); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
              >
                {REPORT_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">From Date</label>
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setGenerated(false); }} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">To Date</label>
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setGenerated(false); }} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Quick Range</label>
              <div className="flex flex-wrap gap-1">
                {DATE_PRESETS.map(p => (
                  <button key={p.label} onClick={() => { const v = p.getValue(); setFromDate(v.from); setToDate(v.to); setGenerated(false); }}
                    className="px-2 py-1 text-[11px] font-semibold rounded border border-border bg-background hover:bg-muted text-muted-foreground transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              Report: <strong>{REPORT_TYPES.find(r => r.value === reportType)?.label}</strong> &nbsp;|&nbsp; Period: <strong>{fromDate}</strong> to <strong>{toDate}</strong>
            </p>
            <div className="flex items-center gap-2">
              {generated && (
                <button onClick={handlePrint} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-background hover:bg-muted font-semibold">
                  <Printer className="h-4 w-4" /> Print
                </button>
              )}
              <button onClick={handleGenerate} disabled={isLoading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-55">
                <FileText className="h-4 w-4" />
                {isLoading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>

        {/* Report Output */}
        {generated && !isLoading && renderReport()}
        {generated && isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
            <span className="ml-3 text-sm text-muted-foreground">Generating report...</span>
          </div>
        )}
        {!generated && (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-xl text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="font-medium text-foreground">Select a report type and date range</p>
            <p className="text-xs text-muted-foreground mt-1">Then click "Generate Report" to view results</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
