import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateItem, useSuppliers, useStorageLocations } from '@/features/inventory/hooks/useInventory';

const CATEGORIES = ['Engine Oil', 'Filters', 'Brake Parts', 'Ignition', 'Fluids', 'Tires', 'Batteries', 'Other'];
const UNITS = ['pcs', 'L', 'ml', 'kg', 'g', 'box', 'set'];

export function AddPartModal({ open, onClose }) {
  const createItem = useCreateItem();
  const { data: suppliers } = useSuppliers();
  const { data: locations } = useStorageLocations();
  const [form, setForm] = useState({ item_code: '', name: '', category: '', brand: '', part_number: '', unit: 'pcs', minimum_stock: '', reorder_quantity: '', unit_cost: '', selling_price: '', supplier_id: '', storage_location_id: '' });
  const [error, setError] = useState(null);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await createItem.mutateAsync({
        ...form,
        minimum_stock: form.minimum_stock ? Number(form.minimum_stock) : 0,
        reorder_quantity: form.reorder_quantity ? Number(form.reorder_quantity) : 0,
        unit_cost: form.unit_cost ? Number(form.unit_cost) : 0,
        selling_price: form.selling_price ? Number(form.selling_price) : null,
      });
      toast.success(`${form.name} added to inventory`);
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not create item.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Add consumable part</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item code"><Input value={form.item_code} onChange={(event) => set('item_code', event.target.value)} placeholder="Auto if left blank" /></Field>
            <Field label="Part name"><Input value={form.name} onChange={(event) => set('name', event.target.value)} required /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><select value={form.category} onChange={(event) => set('category', event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select...</option>{CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></Field>
            <Field label="Brand"><Input value={form.brand} onChange={(event) => set('brand', event.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Part number"><Input value={form.part_number} onChange={(event) => set('part_number', event.target.value)} /></Field>
            <Field label="Unit"><select value={form.unit} onChange={(event) => set('unit', event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">{UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Minimum stock"><Input type="number" min="0" value={form.minimum_stock} onChange={(event) => set('minimum_stock', event.target.value)} /></Field>
            <Field label="Reorder quantity"><Input type="number" min="0" value={form.reorder_quantity} onChange={(event) => set('reorder_quantity', event.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit cost"><Input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(event) => set('unit_cost', event.target.value)} /></Field>
            <Field label="Selling price (optional)"><Input type="number" min="0" step="0.01" value={form.selling_price} onChange={(event) => set('selling_price', event.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier"><select value={form.supplier_id} onChange={(event) => set('supplier_id', event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select...</option>{(suppliers ?? []).map((supplier) => <option key={supplier.supplier_id} value={supplier.supplier_id}>{supplier.name}</option>)}</select></Field>
            <Field label="Storage location"><select value={form.storage_location_id} onChange={(event) => set('storage_location_id', event.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Select...</option>{(locations ?? []).map((location) => <option key={location.location_id} value={location.location_id}>{location.path ?? location.name}</option>)}</select></Field>
          </div>
          <p className="text-xs text-muted-foreground">New items start at 0 quantity. Use <strong>Receive Stock</strong> right after to record the actual quantity on hand.</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={createItem.isPending}>{createItem.isPending ? 'Creating...' : 'Add part'}</Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><Label className="text-xs">{label}</Label>{children}</div>;
}