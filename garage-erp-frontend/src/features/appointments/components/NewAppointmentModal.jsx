import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateAppointment, useUpdateAppointment, useTechnicians } from '@/features/appointments/hooks/useAppointments';
import { useAuthStore } from '@/features/auth/store/authStore';

const SERVICE_TYPES = [
  'Oil Change', 'Brake Service', 'Diagnostic', 'Full Service',
  'Tire Service', 'AC Service', 'Engine Repair', 'Transmission Service',
  'Battery Replacement', 'Other',
];

/**
 * Props:
 *  open          – boolean
 *  onClose       – () => void
 *  bays          – bay array from useBays
 *  defaultDate   – 'YYYY-MM-DD'
 *  defaultStart  – 'YYYY-MM-DDTHH:mm'  (pre-filled from slot click)
 *  defaultEnd    – 'YYYY-MM-DDTHH:mm'
 *  defaultBayId  – number | null
 */
export function NewAppointmentModal({
  open,
  onClose,
  bays,
  defaultDate,
  defaultStart,
  defaultEnd,
  defaultBayId,
  editData,
}) {
  const { user } = useAuthStore();
  const branchId = user?.branch_id;
  const { data: technicians } = useTechnicians(branchId);
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();

  const resolvedDate = defaultDate ?? new Date().toISOString().slice(0, 10);
  const resolvedStart = editData?.scheduled_start ?? defaultStart ?? `${resolvedDate}T09:00`;
  const resolvedEnd   = editData?.scheduled_end ?? defaultEnd   ?? `${resolvedDate}T10:00`;

  const [form, setForm] = useState({
    customer_name: editData ? (editData.customer ? `${editData.customer.first_name} ${editData.customer.last_name}` : editData.customer_name) : '',
    vehicle_name: editData ? (editData.vehicle ? `${editData.vehicle.make} ${editData.vehicle.model}` : editData.vehicle_name) : '',
    vin: editData?.vehicle?.vin ?? '',
    technician_name: editData?.technician ? editData.technician.username : '',
    service_types: editData?.service_type ? editData.service_type.split(', ') : [],
    bay_id: editData?.bay_id ? String(editData.bay_id) : (defaultBayId ? String(defaultBayId) : ''),
    scheduled_start: resolvedStart,
    scheduled_end: resolvedEnd,
    is_walkin: editData?.is_walkin ?? false,
  });
  const [error, setError] = useState(null);

  // Re-sync defaults when slot-click opens the modal with new values
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editData) {
      setForm({
        customer_name: editData.customer ? `${editData.customer.first_name ?? ''} ${editData.customer.last_name ?? ''}`.trim() : (editData.customer_name ?? ''),
        vehicle_name: editData.vehicle ? `${editData.vehicle.make ?? ''} ${editData.vehicle.model ?? ''}`.trim() : (editData.vehicle_name ?? ''),
        vin: editData.vehicle?.vin ?? '',
        technician_name: editData.technician ? editData.technician.username : '',
        service_types: editData.service_type ? editData.service_type.split(', ') : [],
        bay_id: editData.bay_id ? String(editData.bay_id) : '',
        scheduled_start: editData.scheduled_start.slice(0, 16),
        scheduled_end: editData.scheduled_end ? editData.scheduled_end.slice(0, 16) : resolvedEnd,
        is_walkin: editData.is_walkin ?? false,
      });
    } else {
      setForm((f) => ({
        ...f,
        customer_name: '',
        vehicle_name: '',
        vin: '',
        technician_name: '',
        service_types: [],
        bay_id: defaultBayId ? String(defaultBayId) : '',
        scheduled_start: defaultStart ?? `${defaultDate}T09:00`,
        scheduled_end:   defaultEnd   ?? `${defaultDate}T10:00`,
        is_walkin: false,
      }));
    }
  }, [open, defaultStart, defaultEnd, defaultBayId, editData]);

  if (!open) return null;

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function toggleService(service) {
    setForm((f) => {
      const already = f.service_types.includes(service);
      return {
        ...f,
        service_types: already
          ? f.service_types.filter((s) => s !== service)
          : [...f.service_types, service],
      };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (form.service_types.length === 0) {
      setError('Please select at least one service type.');
      return;
    }
    try {
      const payload = {
        customer_name: form.customer_name,
        vehicle_name:  form.vehicle_name,
        vin:           form.vin,
        technician_name: form.technician_name || undefined,
        service_type:  form.service_types.join(', '),
        bay_id:        form.bay_id ? Number(form.bay_id) : null,
        scheduled_start: form.scheduled_start,
        scheduled_end:   form.scheduled_end,
        is_walkin: form.is_walkin,
      };

      if (editData) {
        await updateAppointment.mutateAsync({ appointmentId: editData.appointment_id, ...payload });
      } else {
        await createAppointment.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message ?? `Could not ${editData ? 'update' : 'book'} this appointment.`);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-10 bg-card"
          style={{ background: 'linear-gradient(135deg, hsl(84 15% 10%) 0%, hsl(84 12% 14%) 100%)' }}
        >
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight" style={{ color: 'hsl(45 30% 95%)' }}>
              {editData ? 'Edit Appointment' : 'New Appointment'}
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: 'hsl(84 15% 55%)' }}>
              {form.scheduled_start.replace('T', ' ').slice(0, 16)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 transition-colors hover:bg-white/10"
            style={{ color: 'hsl(84 10% 65%)' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Customer & Vehicle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Customer Full Name
              </Label>
              <Input
                placeholder="e.g. Dawit Bekele"
                value={form.customer_name}
                onChange={(e) => set('customer_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Vehicle Name
              </Label>
              <Input
                placeholder="e.g. Toyota Hilux 2020"
                value={form.vehicle_name}
                onChange={(e) => set('vehicle_name', e.target.value)}
                required
              />
            </div>
          </div>

          {/* VIN & Technician */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                VIN
              </Label>
              <Input
                placeholder="e.g. 1HGBH41JXMN109186"
                value={form.vin}
                onChange={(e) => set('vin', e.target.value.toUpperCase())}
                maxLength={17}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Technician
              </Label>
              {technicians?.length ? (
                <select
                  value={form.technician_name}
                  onChange={(e) => set('technician_name', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t.user_id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="e.g. Samuel Alemu"
                  value={form.technician_name}
                  onChange={(e) => set('technician_name', e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Service Types */}
          <div className="space-y-2">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Service Type <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map((service) => {
                const checked = form.service_types.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm text-left transition-all ${
                      checked
                        ? 'border-transparent text-white'
                        : 'border-border bg-background text-foreground hover:border-primary/60 hover:bg-muted'
                    }`}
                    style={checked ? { background: 'hsl(84 25% 30%)' } : {}}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                        checked ? 'border-transparent bg-white' : 'border-input bg-background'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" style={{ color: 'hsl(84 25% 30%)' }} strokeWidth={3} />}
                    </span>
                    {service}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bay & Times */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bay</Label>
              <select
                value={form.bay_id}
                onChange={(e) => set('bay_id', e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Unassigned</option>
                {bays?.map((b) => (
                  <option key={b.bay_id} value={b.bay_id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_start}
                onChange={(e) => set('scheduled_start', e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">End</Label>
              <Input
                type="datetime-local"
                value={form.scheduled_end}
                onChange={(e) => set('scheduled_end', e.target.value)}
              />
            </div>
          </div>

          {/* Walk-in */}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                form.is_walkin ? 'border-transparent' : 'border-input bg-background'
              }`}
              style={form.is_walkin ? { background: 'hsl(84 25% 30%)' } : {}}
            >
              {form.is_walkin && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={form.is_walkin}
              onChange={(e) => set('is_walkin', e.target.checked)}
            />
            <span className="text-muted-foreground">Walk-in customer</span>
          </label>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive border border-destructive/20">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={onClose} 
              disabled={createAppointment.isPending || updateAppointment.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white"
              style={{ background: 'hsl(84 25% 30%)' }}
              disabled={createAppointment.isPending || updateAppointment.isPending}
            >
              {(createAppointment.isPending || updateAppointment.isPending) 
                ? 'Saving...' 
                : (editData ? 'Update Appointment' : 'Book Appointment')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
