import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePurchase } from '../hooks/usePurchases';
import { useSuppliersList } from '../hooks/useSuppliers';
import { useInventoryItems } from '@/features/inventory/hooks/useInventory';

export function NewPurchaseModal({ open, onClose }) {
  const createPurchase = useCreatePurchase();
  const { data: suppliersData } = useSuppliersList({ per_page: 100 });
  const { data: itemsData } = useInventoryItems({ per_page: 200 });

  const suppliers = suppliersData?.data ?? [];
  const inventoryItems = itemsData?.data ?? [];

  const [form, setForm] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_reference: '',
    payment_status: 'unpaid',
    amount_paid: '',
    notes: '',
    items: [
      { item_name: '', inventory_item_id: '', quantity: '', unit_price: '', total: 0 }
    ]
  });

  const [error, setError] = useState(null);

  if (!open) return null;

  const handleFieldChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleItemFieldChange = (index, field, value) => {
    setForm((current) => {
      const items = [...current.items];
      const item = { ...items[index] };

      // If user links an inventory item, auto-fill the item name
      if (field === 'inventory_item_id' && value) {
        const matched = inventoryItems.find(i => String(i.item_id) === String(value));
        if (matched) {
          item.item_name = matched.name;
        }
      }

      item[field] = value;

      // Recalculate total for this item
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      item.total = qty * price;

      items[index] = item;
      return { ...current, items };
    });
  };

  const handleAddItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { item_name: '', inventory_item_id: '', quantity: '', unit_price: '', total: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (form.items.length <= 1) return;
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, idx) => idx !== index)
    }));
  };

  const calculateGrandTotal = () => {
    return form.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.supplier_id) {
      setError('Supplier is required.');
      return;
    }
    if (!form.purchase_date) {
      setError('Purchase date is required.');
      return;
    }

    // Validate items
    for (let i = 0; i < form.items.length; i++) {
      const item = form.items[i];
      if (!item.item_name.trim()) {
        setError(`Item #${i + 1} Name is required.`);
        return;
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError(`Item #${i + 1} Quantity must be greater than 0.`);
        return;
      }
      const price = parseFloat(item.unit_price);
      if (isNaN(price) || price < 0) {
        setError(`Item #${i + 1} Unit Price must be 0 or greater.`);
        return;
      }
    }

    // Prepare payload
    const grandTotal = calculateGrandTotal();
    let finalAmountPaid = 0;
    if (form.payment_status === 'paid') {
      finalAmountPaid = grandTotal;
    } else if (form.payment_status === 'partial') {
      finalAmountPaid = parseFloat(form.amount_paid) || 0;
      if (finalAmountPaid > grandTotal) {
        finalAmountPaid = grandTotal;
      }
    }

    const payload = {
      supplier_id: Number(form.supplier_id),
      purchase_date: form.purchase_date,
      invoice_reference: form.invoice_reference || null,
      payment_status: form.payment_status,
      amount_paid: finalAmountPaid,
      notes: form.notes || null,
      items: form.items.map(item => ({
        item_name: item.item_name,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        inventory_item_id: item.inventory_item_id ? Number(item.inventory_item_id) : null
      }))
    };

    try {
      await createPurchase.mutateAsync(payload);
      toast.success('Purchase saved successfully.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save purchase.');
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
          maxWidth: '800px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">Record New Purchase</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Top Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Supplier *
              </label>
              <select
                value={form.supplier_id}
                onChange={(e) => handleFieldChange('supplier_id', e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">Select Supplier</option>
                {suppliers.filter(s => s.status === 'active').map(s => (
                  <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => handleFieldChange('purchase_date', e.target.value)}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Invoice/Reference Number
              </label>
              <input
                type="text"
                placeholder="INV-XXXX"
                value={form.invoice_reference}
                onChange={(e) => handleFieldChange('invoice_reference', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Payment Status
                </label>
                <select
                  value={form.payment_status}
                  onChange={(e) => handleFieldChange('payment_status', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {form.payment_status === 'partial' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                    Amount Paid (ETB)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={form.amount_paid}
                    onChange={(e) => handleFieldChange('amount_paid', e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Purchased Items Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">Purchased Items</h3>
            
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-3 items-end bg-slate-50/50 border border-slate-100 p-3 rounded-lg relative group">
                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-3 w-full">
                    {/* Optional Inventory Link */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Link Inventory Item (Optional)
                      </label>
                      <select
                        value={item.inventory_item_id}
                        onChange={(e) => handleItemFieldChange(idx, 'inventory_item_id', e.target.value)}
                        className="w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="">Not linked</option>
                        {inventoryItems.map(i => (
                          <option key={i.item_id} value={i.item_id}>{i.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Item Name */}
                    <div className="md:col-span-4">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Item Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Engine Oil"
                        value={item.item_name}
                        onChange={(e) => handleItemFieldChange(idx, 'item_name', e.target.value)}
                        required
                        className="w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Qty */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={item.quantity}
                        onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                        required
                        className="w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemFieldChange(idx, 'unit_price', e.target.value)}
                        required
                        className="w-full rounded-md border border-input bg-white px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Item Total */}
                    <div className="text-right flex-1 md:flex-none">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Total</span>
                      <span className="text-xs font-semibold text-slate-800">
                        ETB {Number(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={form.items.length <= 1}
                      className="p-1.5 rounded text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline pt-1"
            >
              <Plus className="h-3 w-3" /> Add Item
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Notes
            </label>
            <textarea
              placeholder="Purchased for workshop stock, special client job card, etc..."
              value={form.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Grand Total Bar */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-900">
            <span>Grand Total:</span>
            <span className="text-lg font-bold text-slate-800">
              ETB {calculateGrandTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {error && <p className="text-sm text-destructive font-medium">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={createPurchase.isPending}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPurchase.isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:bg-opacity-95 disabled:opacity-50 flex items-center gap-1.5"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              {createPurchase.isPending ? 'Saving...' : 'Save Purchase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
