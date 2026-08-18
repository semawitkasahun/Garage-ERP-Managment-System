import { useRef } from 'react';
import { Printer, Download } from 'lucide-react';

/**
 * Professional payment receipt document component
 */
export function PaymentReceipt({ data, onPrint, onDownload }) {
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
      <html><head><title>Payment Receipt - ${data.receipt_number}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; padding: 32px; font-size: 13px; max-width: 500px; margin: 0 auto; }
        .receipt-border { border: 2px solid #5E6945; border-radius: 8px; padding: 24px; }
        .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
        .header h1 { color: #5E6945; font-size: 18px; margin-bottom: 4px; }
        .receipt-title { text-align: center; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; color: #5E6945; margin-bottom: 16px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dotted #ddd; }
        .row:last-child { border-bottom: none; }
        .label { color: #888; }
        .value { font-weight: 600; text-align: right; }
        .amount-box { text-align: center; margin: 16px 0; padding: 16px; background: #f0f2ec; border-radius: 6px; border: 1px solid #5E6945; }
        .amount-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; }
        .amount { font-size: 24px; font-weight: 800; color: #5E6945; }
        .status-badge { display: inline-block; padding: 4px 16px; background: #27ae60; color: white; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; }
        .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #ccc; font-size: 11px; color: #999; }
        @media print { body { padding: 0; } .receipt-border { border: 1px solid #333; } }
      </style></head><body><div class="receipt-border">${content.innerHTML}</div></body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    if (onDownload) { onDownload(); return; }
    handlePrint();
  };

  const methodLabels = { bank_transfer: 'Bank Transfer', cash: 'Cash', other: 'Other' };

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent/30 transition-colors">
          <Printer className="h-4 w-4" /> Print Receipt
        </button>
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-colors" style={{ background: 'hsl(84 25% 30%)' }}>
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Receipt Document */}
      <div ref={printRef} className="bg-white rounded-lg border-2 p-8 shadow-sm" style={{ maxWidth: '480px', borderColor: '#5E6945' }}>
        {/* Company Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px dashed #ccc', paddingBottom: '16px', marginBottom: '16px' }}>
          <h1 style={{ color: '#5E6945', fontSize: '20px', fontWeight: 800, marginBottom: '2px' }}>{data.company?.name || 'Garage ERP'}</h1>
          {data.company?.address && <p style={{ color: '#888', fontSize: '12px' }}>{data.company.address}</p>}
          {data.company?.phone && <p style={{ color: '#888', fontSize: '12px' }}>Tel: {data.company.phone}</p>}
        </div>

        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '3px', color: '#5E6945', marginBottom: '16px' }}>
          Payment Receipt
        </div>

        {/* Receipt Details */}
        <div style={{ fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Receipt No.</span>
            <span style={{ fontWeight: 700, color: '#5E6945' }}>{data.receipt_number}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Employee</span>
            <span style={{ fontWeight: 600 }}>{data.employee?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Employee ID</span>
            <span style={{ fontWeight: 600 }}>{data.employee?.employee_code}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Payroll Period</span>
            <span style={{ fontWeight: 600 }}>{data.payroll_period}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Period Dates</span>
            <span style={{ fontWeight: 600 }}>{data.period_dates}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div style={{ textAlign: 'center', margin: '16px 0', padding: '16px', background: '#f0f2ec', borderRadius: '8px', border: '1px solid #5E6945' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', color: '#666', marginBottom: '4px' }}>Amount Paid</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#5E6945' }}>{formatCurrency(data.amount_paid)}</div>
        </div>

        {/* Payment Info */}
        <div style={{ fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Payment Method</span>
            <span style={{ fontWeight: 600 }}>{methodLabels[data.payment_method] || data.payment_method}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Payment Date</span>
            <span style={{ fontWeight: 600 }}>{data.payment_date}</span>
          </div>
          {data.payment_reference && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
              <span style={{ color: '#888' }}>Reference</span>
              <span style={{ fontWeight: 600 }}>{data.payment_reference}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dotted #ddd' }}>
            <span style={{ color: '#888' }}>Authorized By</span>
            <span style={{ fontWeight: 600 }}>{data.processed_by || 'HR / Finance Manager'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ color: '#888' }}>Status</span>
            <span style={{ display: 'inline-block', padding: '2px 12px', background: '#27ae60', color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>
              {data.status}
            </span>
          </div>
        </div>

        {/* Authorized Signature Area */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #ccc' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', marginBottom: '32px' }}>
            Authorized Signature & Stamp
          </div>
          <div style={{ borderBottom: '1px solid #333', width: '60%' }}></div>
          <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>Approved & Released by Management</div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '2px dashed #ccc', fontSize: '11px', color: '#999' }}>
          <p>Thank you for your service.</p>
          <p style={{ marginTop: '4px' }}>Generated: {new Date(data.generated_at || Date.now()).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
