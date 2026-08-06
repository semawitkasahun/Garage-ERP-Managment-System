import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Car, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCreateCustomer, useUpdateCustomer } from '@/features/customers/hooks/useCustomers';

const CUSTOMER_TYPES = ['individual', 'fleet', 'corporate'];
const SEGMENTS = ['walk-in', 'VIP', 'fleet'];

const FIELD_GROUPS = [
  {
    title: 'Personal Information',
    icon: User,
    fields: 'personal',
  },
  {
    title: 'Contact Details',
    icon: Phone,
    fields: 'contact',
  },
  {
    title: 'Vehicle (Optional)',
    icon: Car,
    fields: 'vehicle',
  },
];

function FormField({ label, required, children, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: 'hsl(90 15% 25%)' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: 'hsl(0 65% 48%)' }}>*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(0 65% 48%)' }}>
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

function StyledInput({ ...props }) {
  return (
    <input
      {...props}
      className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-all focus:ring-2"
      style={{
        borderColor: 'hsl(45 15% 83%)',
        '--tw-ring-color': 'hsl(84 25% 40% / 0.25)',
      }}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className="w-full appearance-none rounded-md border bg-white px-3 py-2 text-sm outline-none transition-all pr-8 focus:ring-2"
        style={{
          borderColor: 'hsl(45 15% 83%)',
          '--tw-ring-color': 'hsl(84 25% 40% / 0.25)',
        }}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: 'hsl(90 8% 50%)' }} />
    </div>
  );
}

function StyledTextarea({ ...props }) {
  return (
    <textarea
      {...props}
      className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-all resize-none focus:ring-2"
      style={{
        borderColor: 'hsl(45 15% 83%)',
        '--tw-ring-color': 'hsl(84 25% 40% / 0.25)',
      }}
    />
  );
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  emergencyContact: '',
  customerType: 'individual',
  segment: 'walk-in',
  notes: '',
};

const EMPTY_VEHICLE = {
  make: '',
  model: '',
  year: '',
  plate_number: '',
  vin: '',
  mileage: '',
};

export function AddCustomerModal({ open, onClose, editCustomer = null }) {
  const { user } = useAuthStore();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [form, setForm] = useState(EMPTY_FORM);
  const [includeVehicle, setIncludeVehicle] = useState(false);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [createdInfo, setCreatedInfo] = useState(null);

  const isEdit = !!editCustomer;

  useEffect(() => {
    if (open && editCustomer) {
      const nameParts = (editCustomer.name ?? '').split(' ');
      setForm({
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' ') ?? '',
        email: editCustomer.email ?? '',
        phone: editCustomer.phone ?? '',
        address: editCustomer.address ?? '',
        city: editCustomer.city ?? '',
        emergencyContact: editCustomer.emergency_contact ?? '',
        customerType: editCustomer.customer_type ?? 'individual',
        segment: editCustomer.segment ?? 'walk-in',
        notes: editCustomer.notes ?? '',
      });
    } else if (open && !editCustomer) {
      setForm(EMPTY_FORM);
      setVehicle(EMPTY_VEHICLE);
      setIncludeVehicle(false);
    }
    setErrors({});
    setApiError(null);
    setCreatedInfo(null);
  }, [open, editCustomer]);

  if (!open) return null;

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  }

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!isEdit && !form.email.trim()) errs.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      if (isEdit) {
        await updateCustomer.mutateAsync({
          customerId: editCustomer.customer_id,
          payload: {
            first_name: form.firstName,
            last_name: form.lastName,
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            emergency_contact: form.emergencyContact,
            customer_type: form.customerType,
            segment: form.segment,
            notes: form.notes,
          },
        });
        onClose();
      } else {
        const payload = {
          customer: {
            first_name: form.firstName,
            last_name: form.lastName,
            name: `${form.firstName} ${form.lastName}`.trim(),
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            emergency_contact: form.emergencyContact,
            customer_type: form.customerType,
            segment: form.segment,
            notes: form.notes,
            branch_id: user?.branch_id,
          },
        };
        if (includeVehicle && (vehicle.make || vehicle.plate_number)) {
          payload.vehicle = {
            ...vehicle,
            year: vehicle.year ? Number(vehicle.year) : null,
            mileage: vehicle.mileage ? Number(vehicle.mileage) : null,
          };
        }
        const res = await createCustomer.mutateAsync(payload);
        setCreatedInfo(res.data);
      }
    } catch (err) {
      setApiError(err.response?.data?.message ?? 'Could not save customer.');
    }
  }

  function handleClose() {
    setCreatedInfo(null);
    onClose();
  }

  const isPending = createCustomer.isPending || updateCustomer.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 20, 12, 0.55)', backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-xl overflow-hidden shadow-2xl"
        style={{ background: 'hsl(45 30% 98%)', border: '1px solid hsl(45 15% 88%)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ background: 'linear-gradient(135deg, hsl(90 14% 7%) 0%, hsl(84 18% 14%) 100%)', borderBottom: '1px solid hsl(84 15% 20%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'hsl(84 25% 30% / 0.4)' }}>
              <User className="h-4.5 w-4.5" style={{ color: 'hsl(84 35% 72%)' }} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold" style={{ color: 'hsl(45 30% 95%)' }}>
                {isEdit ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <p className="text-xs" style={{ color: 'hsl(84 10% 55%)' }}>
                {isEdit ? 'Update customer details' : 'Create a new customer account'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: 'hsl(84 10% 55%)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 20%)'; e.currentTarget.style.color = 'hsl(45 30% 90%)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'hsl(84 10% 55%)'; }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {createdInfo ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'hsl(84 20% 94%)', border: '1px solid hsl(84 20% 80%)' }}>
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'hsl(84 35% 38%)' }} />
                <p className="text-sm font-medium" style={{ color: 'hsl(84 30% 25%)' }}>Customer created successfully!</p>
              </div>
              <div className="rounded-lg border p-4 space-y-2.5" style={{ borderColor: 'hsl(45 15% 85%)', background: 'hsl(45 20% 97%)' }}>
                <p className="text-xs font-mono uppercase tracking-wider" style={{ color: 'hsl(90 8% 45%)' }}>Login Credentials</p>
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Email: </span><span className="font-medium">{createdInfo.user?.email}</span></p>
                  <p><span className="text-muted-foreground">Temporary password: </span>
                    <code className="rounded px-1.5 py-0.5 text-xs font-mono" style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 30% 22%)' }}>
                      {createdInfo.user?.temporary_password}
                    </code>
                  </p>
                </div>
                <p className="text-xs" style={{ color: 'hsl(90 8% 50%)' }}>Share these credentials with the customer. The system will also send an email once email sending is configured.</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 38%)' }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(84 25% 38%)' }}>Personal Information</h3>
                  <div className="flex-1 h-px" style={{ background: 'hsl(45 15% 87%)' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="First Name" required error={errors.firstName}>
                    <StyledInput value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} placeholder="e.g. Dawit" />
                  </FormField>
                  <FormField label="Last Name" required error={errors.lastName}>
                    <StyledInput value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} placeholder="e.g. Bekele" />
                  </FormField>
                  <FormField label="Customer Type">
                    <StyledSelect value={form.customerType} onChange={(e) => setField('customerType', e.target.value)}>
                      {CUSTOMER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </StyledSelect>
                  </FormField>
                  <FormField label="Segment">
                    <StyledSelect value={form.segment} onChange={(e) => setField('segment', e.target.value)}>
                      {SEGMENTS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </StyledSelect>
                  </FormField>
                </div>
              </section>

              {/* Contact Details */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 38%)' }} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(84 25% 38%)' }}>Contact Details</h3>
                  <div className="flex-1 h-px" style={{ background: 'hsl(45 15% 87%)' }} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Phone Number">
                    <StyledInput value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+251 9XX XXX XXX" type="tel" />
                  </FormField>
                  <FormField label="Email" required={!isEdit} error={errors.email}>
                    <StyledInput value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="customer@email.com" type="email" />
                  </FormField>
                  <FormField label="Emergency Contact">
                    <StyledInput value={form.emergencyContact} onChange={(e) => setField('emergencyContact', e.target.value)} placeholder="Name & phone number" />
                  </FormField>
                  <FormField label="City">
                    <StyledInput value={form.city} onChange={(e) => setField('city', e.target.value)} placeholder="e.g. Addis Ababa" />
                  </FormField>
                  <div className="col-span-2">
                    <FormField label="Address">
                      <StyledInput value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="Street address, subcity…" />
                    </FormField>
                  </div>
                  <div className="col-span-2">
                    <FormField label="Notes">
                      <StyledTextarea
                        value={form.notes}
                        onChange={(e) => setField('notes', e.target.value)}
                        rows={3}
                        placeholder="Any additional notes about this customer…"
                      />
                    </FormField>
                  </div>
                </div>
              </section>

              {/* Vehicle */}
              {!isEdit && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 38%)' }} />
                    <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'hsl(84 25% 38%)' }}>Vehicle</h3>
                    <div className="flex-1 h-px" style={{ background: 'hsl(45 15% 87%)' }} />
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'hsl(90 8% 45%)' }}>
                      <div
                        className="relative inline-flex h-4.5 w-8 items-center rounded-full transition-colors cursor-pointer"
                        style={{ background: includeVehicle ? 'hsl(84 25% 38%)' : 'hsl(45 15% 78%)' }}
                        onClick={() => setIncludeVehicle((v) => !v)}
                      >
                        <span
                          className="inline-block h-3 w-3 rounded-full bg-white transition-transform shadow-sm"
                          style={{ transform: includeVehicle ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                      </div>
                      Add vehicle now
                    </label>
                  </div>

                  {includeVehicle && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg p-4" style={{ background: 'hsl(84 15% 96%)', border: '1px solid hsl(84 15% 88%)' }}>
                      <FormField label="Make">
                        <StyledInput placeholder="e.g. Toyota" value={vehicle.make} onChange={(e) => setVehicle((v) => ({ ...v, make: e.target.value }))} />
                      </FormField>
                      <FormField label="Model">
                        <StyledInput placeholder="e.g. Hilux" value={vehicle.model} onChange={(e) => setVehicle((v) => ({ ...v, model: e.target.value }))} />
                      </FormField>
                      <FormField label="Year">
                        <StyledInput placeholder="e.g. 2022" type="number" value={vehicle.year} onChange={(e) => setVehicle((v) => ({ ...v, year: e.target.value }))} />
                      </FormField>
                      <FormField label="Plate Number">
                        <StyledInput placeholder="e.g. AA 123-456" value={vehicle.plate_number} onChange={(e) => setVehicle((v) => ({ ...v, plate_number: e.target.value }))} />
                      </FormField>
                      <FormField label="VIN">
                        <StyledInput placeholder="Vehicle ID number" value={vehicle.vin} onChange={(e) => setVehicle((v) => ({ ...v, vin: e.target.value }))} />
                      </FormField>
                      <FormField label="Mileage (km)">
                        <StyledInput placeholder="e.g. 45000" type="number" value={vehicle.mileage} onChange={(e) => setVehicle((v) => ({ ...v, mileage: e.target.value }))} />
                      </FormField>
                    </div>
                  )}
                </section>
              )}

              {apiError && (
                <div className="flex items-center gap-2.5 rounded-lg p-3" style={{ background: 'hsl(0 65% 97%)', border: '1px solid hsl(0 65% 88%)', color: 'hsl(0 65% 42%)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">{apiError}</p>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        {!createdInfo && (
          <div
            className="flex items-center justify-end gap-3 px-6 py-4 shrink-0"
            style={{ borderTop: '1px solid hsl(45 15% 87%)', background: 'hsl(45 20% 97%)' }}
          >
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: 'hsl(90 8% 42%)', border: '1px solid hsl(45 15% 83%)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(45 15% 92%)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="add-customer-form"
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
            >
              {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Customer')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
