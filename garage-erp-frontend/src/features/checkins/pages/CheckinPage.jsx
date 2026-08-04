import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Camera, Trash2, ClipboardCheck, LayoutDashboard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCreateCheckin, useUploadCheckinMedia, useUploadCheckinSignature, useCheckinForm } from '@/features/checkins/hooks/useCheckins';
import { SignaturePad } from '@/features/checkins/components/SignaturePad';

const DEFAULT_CHECKLIST = ['Exterior', 'Interior', 'Tires', 'Windshield & Glass', 'Lights', 'Mirrors', 'Existing Damage']
  .map((name) => ({ item_name: name, status: 'ok', notes: '' }));

const STATUS_OPTIONS = [{ value: 'ok', label: 'OK' }, { value: 'damaged', label: 'Damaged' }, { value: 'na', label: 'N/A' }];
const REQUESTED_SERVICES = ['Oil Change', 'Brake Service', 'Battery Replacement', 'AC Service', 'Engine Diagnosis', 'Tire Rotation', 'Suspension Repair', 'Wheel Alignment', 'Electrical Repair', 'General Inspection'];

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function CheckinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({
    appointment_id: searchParams.get('appointmentId') ?? '',
    vehicle_id: searchParams.get('vehicleId') ?? '',
    customer_id: searchParams.get('customerId') ?? '',
    mileage_in: '', customer_complaint: '', key_tag_number: '',
    color: '', fuel_type: '', transmission: '', requested_services: []
  });
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [files, setFiles] = useState([]);
  const [signature, setSignature] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createCheckin = useCreateCheckin();
  const uploadMedia = useUploadCheckinMedia();
  const uploadSignature = useUploadCheckinSignature();
  
  const formData = useCheckinForm(form.appointment_id);

  useEffect(() => {
    if (formData.data?.checklist_items) {
      setChecklist(formData.data.checklist_items);
    }
    if (formData.data?.appointment) {
      if (formData.data.appointment.vehicle_id) set('vehicle_id', String(formData.data.appointment.vehicle_id));
      if (formData.data.appointment.customer_id) set('customer_id', String(formData.data.appointment.customer_id));
    }
  }, [formData.data]);

  const filePreviews = useMemo(
    () => files.map((f) => ({ file: f, url: URL.createObjectURL(f), isVideo: f.type.startsWith('video') })),
    [files]
  );

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleService = (svc) => {
    setForm(f => {
      const services = f.requested_services.includes(svc) 
        ? f.requested_services.filter(s => s !== svc) 
        : [...f.requested_services, svc];
      return { ...f, requested_services: services };
    });
  };

  const updateChecklistItem = (index, patch) =>
    setChecklist((items) => items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  function handleFilesSelected(e) {
    setFiles((f) => [...f, ...Array.from(e.target.files)]);
    e.target.value = '';
  }
  const removeFile = (index) => setFiles((f) => f.filter((_, i) => i !== index));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const { checkin } = await createCheckin.mutateAsync({
        appointment_id: form.appointment_id || null,
        vehicle_id: Number(form.vehicle_id),
        customer_id: Number(form.customer_id),
        mileage_in: form.mileage_in ? Number(form.mileage_in) : null,
        fuel_level: form.fuel_type || null, 
        customer_complaint: form.customer_complaint || null,
        key_tag_number: form.key_tag_number || null,
        checklist_items: checklist,
      });

      const checkinId = checkin.checkin_id;
      if (files.length) await uploadMedia.mutateAsync({ checkinId, files });
      if (signature) await uploadSignature.mutateAsync({ checkinId, signature });

      setSuccess(true);
      setTimeout(() => navigate('/appointments'), 1200);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not complete check-in.');
    }
  }

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';
  const navSections = [
    {
      label: 'Navigation',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
        { label: 'Check-In', icon: ClipboardCheck, path: '/checkins/new' },
      ],
    },
  ];
  const isSubmitting = createCheckin.isPending || uploadMedia.isPending || uploadSignature.isPending;
  const apt = formData.data?.appointment;

  return (
    <DashboardLayout navSections={navSections} pageTitle="Vehicle Check-In" roleLabel={user?.username ?? 'Staff'}>
      
      {/* Dynamic Header Section */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to={dashboardPath} className="hover:text-foreground">Dashboard</Link>
          <span>→</span>
          <span>Check-In</span>
          <span>→</span>
          <span className="font-medium text-foreground">New Check-In</span>
        </div>
        <div className="text-sm font-medium text-foreground flex items-center gap-4">
          <span>{time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <span className="text-muted-foreground">•</span>
          <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-5xl space-y-6">
        
        {/* Appointment Details Card */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Appointment Details</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-5">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Appointment ID</Label>
              {apt ? <div className="font-medium">{apt.appointment_id}</div> : <Input className="h-8 text-xs" value={form.appointment_id} onChange={(e) => set('appointment_id', e.target.value)} placeholder="Optional" />}
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Walk-In</Label>
              <div className="mt-1.5">
                {apt ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border" style={apt.is_walkin ? { background:'hsl(38 90% 94%)', borderColor:'hsl(38 75% 62%)', color:'hsl(38 55% 28%)' } : { background:'hsl(142 55% 93%)', borderColor:'hsl(142 48% 55%)', color:'hsl(142 45% 22%)' }}>
                    {apt.is_walkin ? 'Walk-In' : 'Appointment'}
                  </span>
                ) : <span className="text-muted-foreground">—</span>}
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Service Advisor</Label>
              <div className="font-medium mt-1.5 truncate">{user?.employee ? `${user.employee.first_name} ${user.employee.last_name}` : user?.username ?? 'N/A'}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Assigned Technician</Label>
              <div className="font-medium mt-1.5 truncate">
                {apt?.technician?.employee ? `${apt.technician.employee.first_name} ${apt.technician.employee.last_name}` : apt?.technician?.username ?? 'Not Assigned'}
              </div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Service Bay</Label>
              <div className="font-medium mt-1.5 truncate">{apt?.bay?.name ?? 'Not Assigned'}</div>
            </div>
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Customer Information</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Full Name</Label>
              {apt?.customer ? (
                <div className="font-medium mt-1.5">{apt.customer.first_name} {apt.customer.last_name}</div>
              ) : (
                <Input type="number" className="h-8 text-xs" value={form.customer_id} onChange={(e) => set('customer_id', e.target.value)} required placeholder="Customer ID" />
              )}
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Customer ID</Label>
              <div className="font-medium mt-1.5">{apt?.customer_id ?? (form.customer_id || 'N/A')}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Phone Number</Label>
              <div className="font-medium mt-1.5">{apt?.customer?.phone ?? 'N/A'}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Email</Label>
              <div className="font-medium mt-1.5 truncate">{apt?.customer?.email ?? 'N/A'}</div>
            </div>
          </div>
        </div>

        {/* Vehicle Information Card */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Vehicle Information</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4 lg:grid-cols-5">
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Make</Label>
              <div className="font-semibold mt-1.5">{apt?.vehicle?.make ?? 'N/A'}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Model</Label>
              <div className="font-semibold mt-1.5">{apt?.vehicle?.model ?? 'N/A'}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Year</Label>
              <div className="font-semibold mt-1.5">{apt?.vehicle?.year ?? 'N/A'}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Plate Number</Label>
              <div className="font-semibold mt-1.5">{apt?.vehicle?.plate_number ?? 'N/A'}</div>
            </div>
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">VIN</Label>
              <div className="font-medium mt-1.5 text-xs tracking-wider">{apt?.vehicle?.vin ?? 'N/A'}</div>
            </div>

            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Color</Label>
              <Input placeholder="E.g. Black" value={form.color} onChange={(e) => set('color', e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Fuel Type</Label>
              <Input placeholder="E.g. Petrol" value={form.fuel_type} onChange={(e) => set('fuel_type', e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Transmission</Label>
              <Input placeholder="E.g. Auto" value={form.transmission} onChange={(e) => set('transmission', e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Previous Mileage</Label>
              <div className="font-semibold mt-1.5">{apt?.vehicle?.mileage ? `${apt.vehicle.mileage.toLocaleString()} km` : 'N/A'}</div>
            </div>
            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Current Mileage</Label>
              <Input type="number" placeholder="Mileage in" value={form.mileage_in} onChange={(e) => set('mileage_in', e.target.value)} className="h-8 text-xs" />
            </div>

            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Vehicle ID</Label>
              {apt ? (
                <div className="font-medium mt-1.5">{apt.vehicle_id}</div>
              ) : (
                <Input type="number" className="h-8 text-xs" value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)} required placeholder="Vehicle ID" />
              )}
            </div>
            <div className="pt-2">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Key Tag Number</Label>
              <Input value={form.key_tag_number} onChange={(e) => set('key_tag_number', e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        </div>

        {/* Service Request Card */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Service Request</h2>
          <div className="space-y-6">
            <div>
              <Label className="text-xs mb-3 block font-medium">Requested Services</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {REQUESTED_SERVICES.map(service => (
                  <label key={service} className="flex items-center gap-2 text-[11px] font-medium cursor-pointer border rounded-md px-3 py-2 hover:bg-accent/50 transition-colors select-none">
                    <input 
                      type="checkbox" 
                      className="rounded border-input text-primary focus:ring-primary" 
                      checked={form.requested_services.includes(service)}
                      onChange={() => toggleService(service)}
                    />
                    <span className="leading-tight">{service}</span>
                  </label>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4 text-xs h-8">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Service
              </Button>
            </div>
            <div>
              <Label className="text-xs mb-2 block font-medium">Customer Complaint / Notes</Label>
              <textarea
                value={form.customer_complaint}
                onChange={(e) => set('customer_complaint', e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe the issues reported by the customer..."
              />
            </div>
          </div>
        </div>

        {/* Condition Checklist */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Condition checklist</h2>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div key={item.item_name} className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium w-40 shrink-0">{item.item_name}</span>
                <div className="flex gap-1.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateChecklistItem(i, { status: opt.value })}
                      className="rounded-md px-2.5 py-1 text-xs font-medium border transition-colors"
                      style={item.status === opt.value
                        ? { background: 'hsl(84 25% 30%)', color: 'white', borderColor: 'hsl(84 25% 30%)' }
                        : { background: 'transparent', color: 'hsl(90 8% 42%)', borderColor: 'hsl(45 15% 87%)' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <Input
                  value={item.notes}
                  onChange={(e) => updateChecklistItem(i, { notes: e.target.value })}
                  placeholder="Notes (optional)"
                  className="sm:max-w-[220px]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Photos & Video */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Photos & video</h2>
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-accent transition-colors">
            <Camera className="h-4 w-4" />
            Add photos or video
            <input type="file" accept="image/*,video/*" multiple capture="environment" onChange={handleFilesSelected} className="hidden" />
          </label>

          {filePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {filePreviews.map((p, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-md border border-border group">
                  {p.isVideo ? <video src={p.url} className="h-full w-full object-cover" /> : <img src={p.url} className="h-full w-full object-cover" alt="" />}
                  <button type="button" onClick={() => removeFile(i)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signature Pad */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Customer signature</h2>
          <SignaturePad onChange={setSignature} />
        </div>

        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        {success && <p className="text-sm font-medium" style={{ color: 'hsl(84 30% 28%)' }}>Check-in completed. Redirecting…</p>}

        <div className="flex items-center justify-end pt-4 pb-12">
          <Button type="submit" size="lg" className="w-full sm:w-auto px-8" style={{ background: 'hsl(84 25% 30%)' }} disabled={isSubmitting}>
            {isSubmitting ? 'Saving check-in…' : 'Complete Check-In'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
