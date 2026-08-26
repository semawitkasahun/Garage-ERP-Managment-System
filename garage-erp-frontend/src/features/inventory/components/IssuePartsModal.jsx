import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIssueStock, useInventoryItems } from '@/features/inventory/hooks/useInventory';

export function IssuePartsModal({ open, onClose }) {
  const issueStock = useIssueStock();
  const { data: itemsData } = useInventoryItems({});
  const items = itemsData?.data ?? [];
  const [form, setForm] = useState({ item_id: '', quantity: '', job_card_id: '', reason: '' });
  const [error, setError] = useState(null);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  if (!open) return null;
  const selectedItem = items.find((item) => String(item.item_id) === String(form.item_id));

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    if (selectedItem && Number(form.quantity) > selectedItem.current_quantity) {
      setError(`Only ${selectedItem.current_quantity} ${selectedItem.unit} in stock.`);
      return;
    }
    try {
      await issueStock.mutateAsync({ ...form, quantity: Number(form.quantity) });
      toast.success('Parts issued');
      setForm({ item_id: '', quantity: '', job_card_id: '', reason: '' });
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not issue stock.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between"><h2 className="font-display text-lg font-semibold tracking-tight">Issue parts</h2><button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Item"><select value={form.item_id} onChange={(event) => set('item_id', event.target.value)} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select item...</option>{items.map((item) => <option key={item.item_id} value={item.item_id}>{item.item_code} - {item.name} ({item.current_quantity} {item.unit} in stock)</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Quantity"><Input type="number" min="1" value={form.quantity} onChange={(event) => set('quantity', event.target.value)} required /></Field><Field label="Job Card ID"><Input value={form.job_card_id} onChange={(event) => set('job_card_id', event.target.value)} placeholder="e.g. JC-00010" required /></Field></div>
          <Field label="Reason / notes"><textarea value={form.reason} onChange={(event) => set('reason', event.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={issueStock.isPending}>{issueStock.isPending ? 'Issuing...' : 'Confirm issue'}</Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}