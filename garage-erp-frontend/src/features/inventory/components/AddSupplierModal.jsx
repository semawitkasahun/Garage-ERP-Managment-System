import { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateSupplier } from '@/features/inventory/hooks/useSuppliersPage';

export function AddSupplierModal({ open, onClose }) {
  const createSupplier = useCreateSupplier();
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [error, setError] = useState(null);
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await createSupplier.mutateAsync(form);
      toast.success(`${form.name} added`);
      setForm({ name: '', contact_person: '', phone: '', email: '', address: '' });
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? 'Could not add supplier.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight">Add supplier</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><Label className="text-xs">Supplier name</Label><Input value={form.name} onChange={(event) => set('name', event.target.value)} required /></div>
          <div><Label className="text-xs">Contact person</Label><Input value={form.contact_person} onChange={(event) => set('contact_person', event.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(event) => set('phone', event.target.value)} /></div><div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(event) => set('email', event.target.value)} /></div></div>
          <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(event) => set('address', event.target.value)} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={createSupplier.isPending}>{createSupplier.isPending ? 'Adding...' : 'Add supplier'}</Button>
        </form>
      </div>
    </div>
  );
}