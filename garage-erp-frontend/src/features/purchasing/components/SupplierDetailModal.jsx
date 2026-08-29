import { useState } from 'react';
import { X, User, Phone, Mail, MapPin, FileText, ShoppingCart, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { useSupplierDetail, useSupplierPurchases, useUpdateSupplier } from '../hooks/useSuppliers';

export function SupplierDetailModal({ open, onClose, supplierId, onViewPurchase }) {
  const { data: supplier, isLoading: isSupplierLoading } = useSupplierDetail(supplierId);
  const { data: purchases, isLoading: isPurchasesLoading } = useSupplierPurchases(supplierId);
  const updateSupplier = useUpdateSupplier();

  if (!open) return null;

  const handleToggleStatus = async () => {
    if (!supplier) return;
    const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
    try {
      await updateSupplier.mutateAsync({
        id: supplierId,
        data: { status: newStatus }
      });
      toast.success(`Supplier status updated to ${newStatus}.`);
    } catch (err) {
      toast.error('Failed to update supplier status.');
    }
  };

  const calculateTotals = () => {
    if (!purchases || purchases.length === 0) {
      return { totalPurchases: 0, totalPaid: 0, outstanding: 0 };
    }

    const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.total_amount || 0), 0);
    const totalPaid = purchases.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
    const outstanding = totalPurchases - totalPaid;

    return { totalPurchases, totalPaid, outstanding };
  };

  const { totalPurchases, totalPaid, outstanding } = calculateTotals();

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">Paid</span>;
      case 'partial':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">Partial</span>;
      case 'unpaid':
      default:
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">Unpaid</span>;
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card, #fff)',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)',
          maxWidth: '750px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-slate-900">
              Supplier: {supplier ? supplier.name : 'Loading...'}
            </h2>
            {supplier && (
              <p className="text-xs text-slate-400 mt-0.5">
                Registered on {new Date(supplier.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSupplierLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading supplier details...</div>
        ) : !supplier ? (
          <div className="p-12 text-center text-destructive">Failed to load supplier.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top Supplier Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Contact Card */}
              <div className="md:col-span-2 space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-lg text-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1.5 mb-2">Contact Details</h3>
                
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <span><strong>Contact:</strong> {supplier.contact_person || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span><strong>Phone:</strong> {supplier.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span><strong>Email:</strong> {supplier.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span><strong>Address:</strong> {supplier.address || '—'}</span>
                </div>
              </div>

              {/* Status and Notes Card */}
              <div className="space-y-4 bg-slate-50 border border-slate-100 p-4 rounded-lg text-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1.5 mb-2">Status</h3>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                      supplier.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {supplier.status}
                    </span>

                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      {supplier.status === 'active' ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-emerald-600" /> Disable
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-slate-400" /> Enable
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b pb-1.5 mb-1.5">Supplier Notes</h3>
                  <p className="text-xs text-slate-500 italic max-h-24 overflow-y-auto">
                    {supplier.notes || 'No notes recorded.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Permanent Financial Statistics */}
            <div className="grid grid-cols-3 gap-4 border-t border-b border-slate-100 py-4">
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Purchases</span>
                <span className="text-base font-bold text-slate-800">
                  ETB {totalPurchases.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
              <div className="text-center border-l border-r border-slate-200">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Paid</span>
                <span className="text-base font-bold text-emerald-700">
                  ETB {totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700">Outstanding Balance</span>
                <span className="text-base font-bold text-rose-700">
                  ETB {outstanding.toLocaleString(undefined, {minimumFractionDigits: 2})}
                </span>
              </div>
            </div>

            {/* Purchase History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <ShoppingCart className="h-4 w-4 text-slate-500" /> Purchase History
              </h3>
              
              {isPurchasesLoading ? (
                <div className="p-6 text-center text-xs text-muted-foreground">Loading purchase history...</div>
              ) : !purchases || purchases.length === 0 ? (
                <p className="text-xs italic text-muted-foreground bg-slate-50 border border-slate-100 p-4 rounded-lg text-center">
                  No purchases recorded from this supplier yet.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2">Purchase #</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Items</th>
                        <th className="px-3 py-2 text-right">Grand Total</th>
                        <th className="px-3 py-2 text-center">Payment</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((purchase) => (
                        <tr key={purchase.purchase_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                          <td className="px-3 py-2 font-mono font-bold text-sky-600">{purchase.purchase_number}</td>
                          <td className="px-3 py-2 text-slate-600">{new Date(purchase.purchase_date).toLocaleDateString()}</td>
                          <td className="px-3 py-2 text-slate-600">
                            {purchase.items?.length || 0} item(s)
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">
                            ETB {Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </td>
                          <td className="px-3 py-2 text-center">{getPaymentStatusBadge(purchase.payment_status)}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => onViewPurchase(purchase.purchase_id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                            >
                              <FileText className="h-3 w-3" /> View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
