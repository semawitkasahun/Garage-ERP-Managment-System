import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateLead } from '@/features/leads/hooks/useLeads';

const LEAD_SOURCES = ['Walk-in', 'Phone Call', 'Website', 'Facebook', 'Instagram', 'Google', 'Referral', 'Existing Customer', 'Fleet Company', 'Email', 'WhatsApp'];
const CONTACT_METHODS = ['Phone', 'SMS', 'WhatsApp', 'Email', 'In Person'];

export function AddLeadModal({ open, onClose }) {
  const createLead = useCreateLead();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [form, setForm] = useState({
    company: '', phone: '', email: '', address: '', source: '',
    interested_service: '', expected_budget: '', preferred_contact_method: '',
    priority: 'medium', notes: '',
  });
  const [includeVehicle, setIncludeVehicle] = useState(false);
  const [vehicle, setVehicle] = useState({ vehicle_make: '', vehicle_model: '', vehicle_year: '', vehicle_plate: '', vehicle_vin: '' });
  const [error, setError] = useState(null);

  if (!open) return null;
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        name: `${firstName} ${lastName}`.trim(),
        ...form,
        expected_budget: form.expected_budget ? Number(form.expected_budget) : null,
      };
      if (includeVehicle) {
        Object.assign(payload, { ...vehicle, vehicle_year: vehicle.vehicle_year ? Number(vehicle.vehicle_year) : null });
      }
      await createLead.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not create lead.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">New lead</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">First name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
            <div><Label className="text-xs">Last name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Company (optional)</Label><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></div>
          <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Lead source</Label>
              <select value={form.source} onChange={(e) => set('source', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select…</option>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs">Priority</Label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {['low', 'medium', 'high'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div><Label className="text-xs">Service interested in</Label><Input value={form.interested_service} onChange={(e) => set('interested_service', e.target.value)} /></div>

          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Expected budget</Label><Input type="number" value={form.expected_budget} onChange={(e) => set('expected_budget', e.target.value)} /></div>
            <div>
              <Label className="text-xs">Preferred contact</Label>
              <select value={form.preferred_contact_method} onChange={(e) => set('preferred_contact_method', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">Select…</option>
                {CONTACT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={includeVehicle} onChange={(e) => setIncludeVehicle(e.target.checked)} />
            They mentioned a specific vehicle
          </label>
          {includeVehicle && (
            <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
              <Input placeholder="Make" value={vehicle.vehicle_make} onChange={(e) => setVehicle((v) => ({ ...v, vehicle_make: e.target.value }))} />
              <Input placeholder="Model" value={vehicle.vehicle_model} onChange={(e) => setVehicle((v) => ({ ...v, vehicle_model: e.target.value }))} />
              <Input placeholder="Year" type="number" value={vehicle.vehicle_year} onChange={(e) => setVehicle((v) => ({ ...v, vehicle_year: e.target.value }))} />
              <Input placeholder="Plate (optional)" value={vehicle.vehicle_plate} onChange={(e) => setVehicle((v) => ({ ...v, vehicle_plate: e.target.value }))} />
              <Input placeholder="VIN (optional)" value={vehicle.vehicle_vin} onChange={(e) => setVehicle((v) => ({ ...v, vehicle_vin: e.target.value }))} className="col-span-2" />
            </div>
          )}

          <div><Label className="text-xs">Notes</Label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={createLead.isPending}>
            {createLead.isPending ? 'Creating…' : 'Create lead'}
          </Button>
        </form>
      </div>
    </div>
  );
}