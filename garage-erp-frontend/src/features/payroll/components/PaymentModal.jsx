import { useState, useEffect, useRef } from 'react';
import { X, CreditCard, DollarSign, Calendar, FileText, User } from 'lucide-react';

/**
 * Professional payment form modal for employee payroll payment
 */
export function PaymentModal({
  open,
  onClose,
  onConfirm,
  employee,
  period,
  netSalary,
  loading = false,
}) {
  const overlayRef = useRef(null);
  const [formData, setFormData] = useState({
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
    notes: '',
  });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setShowConfirm(false);
      setFormData({
        payment_method: 'bank_transfer',
        payment_date: new Date().toISOString().split('T')[0],
        payment_reference: '',
        notes: '',
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open && !loading) {
        if (showConfirm) setShowConfirm(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose, loading, showConfirm]);

  if (!open) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency', currency: 'ETB', minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmPayment = () => {
    onConfirm(formData);
  };

  const paymentMethodLabels = {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    other: 'Other',
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && !loading) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        animation: 'pmFadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--card, #fff)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          maxWidth: '540px', width: '92%', maxHeight: '90vh', overflow: 'auto',
          animation: 'pmSlideUp 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'hsl(84 20% 89%)' }}>
              <CreditCard className="h-5 w-5" style={{ color: 'hsl(84 25% 30%)' }} />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold">Process Payment</h3>
              <p className="text-xs text-muted-foreground">Complete employee payroll payment</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-1.5 rounded-md hover:bg-accent/50 transition-colors disabled:opacity-50">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {!showConfirm ? (
          <form onSubmit={handleSubmit}>
            {/* Payment Summary */}
            <div className="p-5 border-b border-border" style={{ background: 'hsl(84 10% 96%)' }}>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Employee</p>
                    <p className="font-medium">{employee?.name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Payroll Period</p>
                    <p className="font-medium">{period?.name || '-'}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Net Salary to Pay</span>
                  <span className="font-display text-xl font-bold" style={{ color: 'hsl(84 25% 30%)' }}>
                    {formatCurrency(netSalary)}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Payment Method *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  required
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Payment Date *</label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Payment / Reference Number</label>
                <input
                  type="text"
                  value={formData.payment_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_reference: e.target.value }))}
                  placeholder="e.g., TRX-20260817-001"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional payment notes..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-5 pb-5">
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent/30 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90 flex items-center gap-2"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                <CreditCard className="h-4 w-4" /> Confirm Payment
              </button>
            </div>
          </form>
        ) : (
          /* Confirmation Screen */
          <div className="p-5">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: 'hsl(42 55% 90%)' }}>
                <DollarSign className="h-7 w-7" style={{ color: 'hsl(42 55% 32%)' }} />
              </div>
              <h4 className="font-display text-lg font-semibold mb-1">Confirm Payment</h4>
              <p className="text-sm text-muted-foreground">Please review the payment details below</p>
            </div>

            <div className="space-y-3 text-sm mb-6 p-4 rounded-lg border border-border bg-accent/20">
              <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{employee?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payroll Period</span><span className="font-medium">{period?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold" style={{ color: 'hsl(84 25% 30%)' }}>{formatCurrency(netSalary)}</span></div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span className="font-medium">{paymentMethodLabels[formData.payment_method]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{formData.payment_date}</span></div>
              {formData.payment_reference && <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-medium">{formData.payment_reference}</span></div>}
              {formData.notes && <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span className="font-medium">{formData.notes}</span></div>}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} disabled={loading} className="px-4 py-2 text-sm font-medium rounded-md border border-border hover:bg-accent/30 transition-colors disabled:opacity-50">
                Back
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="px-5 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                {loading && <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} />}
                {loading ? 'Processing...' : 'Pay Employee'}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pmSlideUp { from { opacity: 0; transform: translateY(12px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
