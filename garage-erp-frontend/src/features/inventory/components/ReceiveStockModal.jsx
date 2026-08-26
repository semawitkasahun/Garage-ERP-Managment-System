import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInventoryItems, useReceiveStock } from '@/features/inventory/hooks/useInventory';

export function ReceiveStockModal({ open, onClose }) {
  const receiveStock = useReceiveStock();
  const { data: itemsData } = useInventoryItems({});
  const items = itemsData?.data ?? [];
  const [form, setForm] = useState({ item_id: '', quantity: '', unit_cost: '', notes: '' });
  const [error, setError] = useState(null);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await receiveStock.mutateAsync({
        ...form,
        item_id: Number(form.item_id),
        quantity: Number(form.quantity),
        unit_cost: form.unit_cost === '' ? null : Number(form.unit_cost),
      });
      toast.success('Stock received and quantity updated.');
      setForm({ item_id: '', quantity: '', unit_cost: '', notes: '' });
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not receive stock.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Receive stock</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Item">
            <select value={form.item_id} onChange={(event) => set('item_id', event.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select item...</option>
              {items.map((item) => <option key={item.item_id} value={item.item_id}>{item.item_code} - {item.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity"><Input type="number" min="1" step="any" value={form.quantity} onChange={(event) => set('quantity', event.target.value)} required /></Field>
            <Field label="Unit cost (optional)"><Input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(event) => set('unit_cost', event.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes} onChange={(event) => set('notes', event.target.value)} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={receiveStock.isPending}>{receiveStock.isPending ? 'Receiving...' : 'Receive stock'}</Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}