import { useRef } from 'react';
import { Printer, Download } from 'lucide-react';

/**
 * Professional payslip document component
 * Printable and downloadable
 */
export function PayslipDocument({ data, onPrint, onDownload }) {
  const printRef = useRef(null);

  if (!data) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency', currency: 'ETB', minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handlePrint = () => {
    if (onPrint) { onPrint(); return; }
    const content = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Payslip - ${data.employee?.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 24px; font-size: 13px; }
        .header { text-align: center; border-bottom: 3px solid #5E6945; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { color: #5E6945; font-size: 20px; margin-bottom: 4px; }
        .header p { color: #666; font-size: 12px; }
        .payslip-title { text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #5E6945; margin-bottom: 16px; padding: 8px; background: #f0f2ec; border-radius: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .info-item label { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 2px; }
        .info-item span { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #5E6945; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; }
        .total-row td { font-weight: 700; border-top: 2px solid #5E6945; background: #f9faf7; }
        .net-salary { text-align: center; padding: 16px; margin: 16px 0; background: #f0f2ec; border-radius: 8px; border: 2px solid #5E6945; }
        .net-salary .label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666; }
        .net-salary .amount { font-size: 28px; font-weight: 800; color: #5E6945; }
        .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    if (onDownload) { onDownload(); return; }
    handlePrint();
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent/30 transition-colors">
          <Printer className="h-4 w-4" /> Print Payslip
        </button>
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors" style={{ background: 'hsl(84 25% 30%)' }}>
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Payslip Document */}
      <div ref={printRef} className="bg-white rounded-lg border border-border p-8 shadow-sm" style={{ maxWidth: '700px' }}>
        {/* Company Header */}
        <div className="header" style={{ textAlign: 'center', borderBottom: '3px solid #5E6945', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ color: '#5E6945', fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>{data.company?.name || 'Garage ERP'}</h1>
          {data.company?.address && <p style={{ color: '#666', fontSize: '12px' }}>{data.company.address}</p>}
          {data.company?.phone && <p style={{ color: '#666', fontSize: '12px' }}>Tel: {data.company.phone} {data.company.email ? `| ${data.company.email}` : ''}</p>}
        </div>

        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#5E6945', marginBottom: '16px', padding: '8px', background: '#f0f2ec', borderRadius: '4px' }}>
          Employee Payslip — {data.payslip_id}
        </div>

        {/* Employee & Period Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div><span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '2px' }}>Employee Name</span><span style={{ fontWeight: 600 }}>{data.employee?.name}</span></div>
          <div><span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '2px' }}>Employee ID</span><span style={{ fontWeight: 600 }}>{data.employee?.employee_code}</span></div>
          <div><span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '2px' }}>Job Title</span><span style={{ fontWeight: 600 }}>{data.employee?.job_title}</span></div>
          <div><span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '2px' }}>Department</span><span style={{ fontWeight: 600 }}>{data.employee?.department}</span></div>
          <div><span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '2px' }}>Payroll Period</span><span style={{ fontWeight: 600 }}>{data.period?.name}</span></div>
          <div><span style={{ display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#999', marginBottom: '2px' }}>Period Dates</span><span style={{ fontWeight: 600 }}>{data.period?.start_date} — {data.period?.end_date}</span></div>
        </div>

        {/* Attendance Summary */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
          <thead>
            <tr>
              <th colSpan={4} style={{ background: '#5E6945', color: 'white', padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Attendance Summary
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>Working Days: <strong>{data.attendance?.working_days}</strong></td>
              <td style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>Present: <strong>{data.attendance?.days_present}</strong></td>
              <td style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>Absent: <strong>{data.attendance?.absent_days}</strong></td>
              <td style={{ padding: '6px 12px', borderBottom: '1px solid #eee' }}>OT Hours: <strong>{data.attendance?.overtime_hours}</strong></td>
            </tr>
          </tbody>
        </table>

        {/* Earnings */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ background: '#5E6945', color: 'white', padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Earnings</th>
              <th style={{ background: '#5E6945', color: 'white', padding: '8px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount (ETB)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>Basic Salary</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(data.earnings?.basic_salary)}</td></tr>
            <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>Overtime Pay</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(data.earnings?.overtime_pay)}</td></tr>
            {data.earnings?.allowances?.map((a, i) => (
              <tr key={i}><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{a.name}</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(a.amount)}</td></tr>
            ))}
            {data.earnings?.bonuses > 0 && <tr><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>Bonuses</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{formatCurrency(data.earnings?.bonuses)}</td></tr>}
            <tr><td style={{ padding: '8px 12px', borderTop: '2px solid #5E6945', background: '#f9faf7', fontWeight: 700 }}>Gross Salary</td><td style={{ padding: '8px 12px', borderTop: '2px solid #5E6945', background: '#f9faf7', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(data.earnings?.gross_salary)}</td></tr>
          </tbody>
        </table>

        {/* Deductions */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
          <thead>
            <tr>
              <th style={{ background: '#8B4513', color: 'white', padding: '8px 12px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Deductions</th>
              <th style={{ background: '#8B4513', color: 'white', padding: '8px 12px', textAlign: 'right', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>Amount (ETB)</th>
            </tr>
          </thead>
          <tbody>
            {data.deductions?.items?.map((d, i) => (
              <tr key={i}><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>{d.name}</td><td style={{ padding: '8px 12px', borderBottom: '1px solid #eee', textAlign: 'right', color: '#c0392b' }}>- {formatCurrency(d.amount)}</td></tr>
            ))}
            <tr><td style={{ padding: '8px 12px', borderTop: '2px solid #8B4513', background: '#fdf6f0', fontWeight: 700 }}>Total Deductions</td><td style={{ padding: '8px 12px', borderTop: '2px solid #8B4513', background: '#fdf6f0', textAlign: 'right', fontWeight: 700, color: '#c0392b' }}>- {formatCurrency(data.deductions?.total_deductions)}</td></tr>
          </tbody>
        </table>

        {/* Net Salary */}
        <div style={{ textAlign: 'center', padding: '16px', margin: '16px 0', background: '#f0f2ec', borderRadius: '8px', border: '2px solid #5E6945' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', color: '#666', marginBottom: '4px' }}>Net Salary</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#5E6945' }}>{formatCurrency(data.net_salary)}</div>
        </div>

        {/* Payment Details */}
        {data.payment && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '16px', fontSize: '12px' }}>
            <div><span style={{ color: '#999' }}>Payment Date: </span><strong>{data.payment.date}</strong></div>
            <div><span style={{ color: '#999' }}>Method: </span><strong>{data.payment.method === 'bank_transfer' ? 'Bank Transfer' : data.payment.method === 'cash' ? 'Cash' : data.payment.method}</strong></div>
            <div><span style={{ color: '#999' }}>Reference: </span><strong>{data.payment.reference || '-'}</strong></div>
            <div><span style={{ color: '#999' }}>Status: </span><strong style={{ color: '#27ae60' }}>PAID</strong></div>
          </div>
        )}

        {/* Authorized Signature Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed #ccc' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '40px' }}>
              Employee Signature
            </div>
            <div style={{ borderBottom: '1px solid #333', width: '80%' }}></div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Date: ________________________</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '40px' }}>
              Authorized Signature & Stamp
            </div>
            <div style={{ borderBottom: '1px solid #333', width: '80%', marginLeft: 'auto' }}></div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>HR / Finance Management</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #ddd', fontSize: '11px', color: '#999' }}>
          <p>This is a system-generated payslip. Generated on {new Date(data.generated_at || Date.now()).toLocaleDateString()}</p>
          <p style={{ marginTop: '4px' }}>{data.company?.name} — Payroll Management System</p>
        </div>
      </div>
    </div>
  );
}
