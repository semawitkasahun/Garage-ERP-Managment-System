import { useState, useRef } from 'react';
import { X, CheckCircle, PlusCircle, Printer, Edit3, Save } from 'lucide-react';
import { toast } from 'sonner';
import {
  usePurchaseDetail,
  useMarkAsPaid,
  useUpdatePayment,
  useAddItemToInventory,
  useUpdatePurchase
} from '../hooks/usePurchases';
import { useAuthStore } from '@/features/auth/store/authStore';

export function PurchaseDetailModal({ open, onClose, purchaseId }) {
  const { user } = useAuthStore();
  const { data: purchase, isLoading, error } = usePurchaseDetail(purchaseId);
  const markAsPaid = useMarkAsPaid();
  const updatePayment = useUpdatePayment();
  const addItemToInventory = useAddItemToInventory();
  const updatePurchase = useUpdatePurchase();

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedInvoiceRef, setEditedInvoiceRef] = useState('');
  
  const [isPayingPartial, setIsPayingPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');

  const printSectionRef = useRef(null);

  if (!open) return null;

  const handleEditNotesToggle = () => {
    if (!purchase) return;
    setEditedNotes(purchase.notes || '');
    setEditedInvoiceRef(purchase.invoice_reference || '');
    setIsEditingNotes(!isEditingNotes);
  };

  const handleSaveNotes = async () => {
    try {
      await updatePurchase.mutateAsync({
        id: purchaseId,
        data: {
          notes: editedNotes,
          invoice_reference: editedInvoiceRef
        }
      });
      toast.success('Purchase updated successfully.');
      setIsEditingNotes(false);
    } catch (err) {
      toast.error('Failed to update notes.');
    }
  };

  const handleMarkPaid = async () => {
    try {
      await markAsPaid.mutateAsync(purchaseId);
      toast.success('Purchase marked as fully paid.');
    } catch (err) {
      toast.error('Failed to update payment status.');
    }
  };

  const handlePartialPaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(partialAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    try {
      await updatePayment.mutateAsync({ id: purchaseId, amountPaid: amt });
      toast.success('Payment details updated.');
      setIsPayingPartial(false);
      setPartialAmount('');
    } catch (err) {
      toast.error('Failed to update payment.');
    }
  };

  const handleAddToInventory = async (itemId, itemName) => {
    const branchId = user?.branch_id || 1;
    try {
      await addItemToInventory.mutateAsync({ itemId, branchId });
      toast.success(`${itemName} added to inventory successfully.`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Failed to add item to inventory.');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !purchase) return;

    // Generate print markup
    const dateStr = purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '';
    const createdDateStr = purchase.created_at ? new Date(purchase.created_at).toLocaleString() : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Receipt - ${purchase.purchase_number}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 24px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #0f172a; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .info-block h3 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; tracking: 0.05em; color: #64748b; }
            .info-block p { margin: 0; font-size: 14px; font-weight: 500; }
            table { w-full; width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th { border-bottom: 2px solid #e2e8f0; text-align: left; padding: 8px; font-size: 12px; font-weight: 600; color: #475569; }
            td { border-bottom: 1px solid #f1f5f9; padding: 10px 8px; font-size: 14px; }
            .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; margin-top: 16px; font-size: 14px; }
            .totals div { display: flex; justify-content: space-between; width: 250px; }
            .grand-total { font-size: 16px; font-weight: 700; border-top: 2px solid #e2e8f0; pt: 8px; margin-top: 8px; }
            .notes { margin-top: 32px; font-size: 13px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 16px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="header">
            <h1>Purchase Record</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #64748b;">No: ${purchase.purchase_number}</p>
          </div>
          
          <div class="grid">
            <div class="info-block">
              <h3>Supplier</h3>
              <p>${purchase.supplier?.name || '—'}</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
                ${purchase.supplier?.phone || ''} ${purchase.supplier?.email ? '• ' + purchase.supplier.email : ''}
              </p>
            </div>
            <div class="info-block" style="text-align: right;">
              <h3>Purchase Date</h3>
              <p>${dateStr}</p>
              <p style="font-size: 12px; color: #64748b; margin-top: 4px;">
                Ref/Invoice: ${purchase.invoice_reference || 'None'}
              </p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items?.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td style="text-align: center;">${Number(item.quantity).toLocaleString()}</td>
                  <td style="text-align: right;">ETB ${Number(item.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style="text-align: right;">ETB ${Number(item.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <span style="color: #64748b;">Subtotal:</span>
              <span>ETB ${Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div>
              <span style="color: #64748b;">Amount Paid:</span>
              <span>ETB ${Number(purchase.amount_paid).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div>
              <span style="color: #64748b;">Remaining Balance:</span>
              <span>ETB ${Number(purchase.total_amount - purchase.amount_paid).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div class="grand-total">
              <span>Grand Total:</span>
              <span>ETB ${Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>

          <div class="notes">
            <p><strong>Payment Status:</strong> ${purchase.payment_status?.toUpperCase()}</p>
            ${purchase.notes ? `<p><strong>Notes:</strong> ${purchase.notes}</p>` : ''}
            <p style="font-size: 10px; color: #94a3b8; margin-top: 48px;">
              Created By: ${purchase.created_by_user?.username || 'System'} on ${createdDateStr}
            </p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">Paid</span>;
      case 'partial':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">Partial</span>;
      case 'unpaid':
      default:
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">Unpaid</span>;
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
          maxWidth: '700px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Purchase Details
              {purchase && <span className="font-mono text-slate-500 font-normal">#{purchase.purchase_number}</span>}
            </h2>
            {purchase && (
              <p className="text-xs text-slate-400 mt-0.5">
                Recorded by {purchase.created_by_user?.username ?? 'system'} on {new Date(purchase.created_at).toLocaleDateString()}
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

        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading purchase details...</div>
        ) : error || !purchase ? (
          <div className="p-12 text-center text-destructive">Failed to load purchase details.</div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Supplier</span>
                <span className="text-sm font-semibold text-slate-800 block">{purchase.supplier?.name || '—'}</span>
                <span className="text-xs text-slate-500 block mt-0.5">{purchase.supplier?.phone || ''} {purchase.supplier?.email ? `• ${purchase.supplier.email}` : ''}</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Purchase Date</span>
                <span className="text-sm font-semibold text-slate-800 block">
                  {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '—'}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">Invoice/Ref: {purchase.invoice_reference || 'None'}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Purchased Items</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.items?.map((item) => (
                      <tr key={item.purchase_item_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-3 py-2.5">
                          <div className="font-semibold text-slate-800">{item.item_name}</div>
                          {item.inventory_item && (
                            <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-100 px-1.5 py-0.5 rounded font-mono mt-0.5 inline-block">
                              Inventory Code: {item.inventory_item.item_code}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium">{Number(item.quantity).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-medium">ETB {Number(item.unit_price).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800">ETB {Number(item.total).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="px-3 py-2.5 text-right">
                          {item.inventory_item_id ? (
                            <button
                              type="button"
                              onClick={() => handleAddToInventory(item.purchase_item_id, item.item_name)}
                              disabled={addItemToInventory.isPending}
                              className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded text-[10px] font-semibold transition-colors disabled:opacity-50"
                            >
                              <PlusCircle className="h-3 w-3" /> Add to Stock
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Not Inventory</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary details */}
            <div className="flex flex-col md:flex-row justify-between gap-6 border-t border-slate-100 pt-4">
              {/* Left Column: Notes & Edit */}
              <div className="flex-1 space-y-3">
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Invoice/Ref</label>
                      <input
                        type="text"
                        value={editedInvoiceRef}
                        onChange={(e) => setEditedInvoiceRef(e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes</label>
                      <textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        rows={2}
                        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={updatePurchase.isPending}
                        className="inline-flex items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => setIsEditingNotes(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Notes & Reference</span>
                      <button
                        onClick={handleEditNotesToggle}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Info"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg italic">
                      {purchase.notes || 'No notes recorded for this purchase.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: Totals & Payments */}
              <div className="w-full md:w-72 space-y-4">
                <div className="space-y-2 bg-slate-50 border border-slate-100 p-4 rounded-lg text-xs font-medium text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span>ETB {Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Payment Status:</span>
                    <span>{getStatusBadge(purchase.payment_status)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                    <span>Grand Total:</span>
                    <span>ETB {Number(purchase.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Amount Paid:</span>
                    <span>ETB {Number(purchase.amount_paid).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 border-t border-slate-200 pt-2 font-semibold">
                    <span>Remaining Owed:</span>
                    <span>ETB {Number(purchase.total_amount - purchase.amount_paid).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                  </div>
                </div>

                {/* Quick actions for payment */}
                {purchase.payment_status !== 'paid' && (
                  <div className="space-y-2">
                    {isPayingPartial ? (
                      <form onSubmit={handlePartialPaymentSubmit} className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={purchase.total_amount}
                          placeholder="Amount"
                          value={partialAmount}
                          onChange={(e) => setPartialAmount(e.target.value)}
                          required
                          className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={updatePayment.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded text-xs font-semibold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPayingPartial(false)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1.5 rounded text-xs"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <button
                          type="button"
                          onClick={handleMarkPaid}
                          disabled={markAsPaid.isPending}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Mark as Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPayingPartial(true)}
                          className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          Record Paid
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Print and Close Bar */}
            <div className="flex justify-between border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                <Printer className="h-4 w-4 text-slate-500" /> Print Record
              </button>

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
