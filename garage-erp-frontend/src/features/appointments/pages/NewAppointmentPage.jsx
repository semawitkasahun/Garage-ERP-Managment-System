import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, CalendarDays, UserCheck, Car, Loader2, Plus, X, LayoutDashboard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCreateAppointment, useBays, useTechnicians } from '@/features/appointments/hooks/useAppointments';
import apiClient from '@/services/http/axios';

const SERVICE_TYPES = [
  'Oil Change',
  'Brake Service',
  'Diagnostic',
  'Full Service',
  'Tire Service',
  'AC Service',
  'Engine Repair',
  'Transmission Service',
  'Battery Replacement',
  'Other',
];

function toDateInputValue(date) {
  return date.toISOString().slice(0, 10);
}

export function NewAppointmentPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const branchId = user?.branch_id;
  const { data: bays } = useBays(branchId);
  const { data: technicians } = useTechnicians(branchId);
  const createAppointment = useCreateAppointment();

  const todayStr = toDateInputValue(new Date());

  const [form, setForm] = useState({
    customer_id: '',
    customer_first_name: '',
    customer_last_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',

    vehicle_id: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: todayStr.slice(0, 4),
    vehicle_plate_number: '',
    vehicle_vin: '',
    vehicle_mileage: '',

    technician_name: '',
    service_types: [],
    bay_id: '',
    scheduled_start: `${todayStr}T09:00`,
    scheduled_end: `${todayStr}T10:00`,
    is_walkin: false,
  });

  const [existingCustomers, setExistingCustomers] = useState([]);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isNewVehicle, setIsNewVehicle] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [error, setError] = useState(null);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return existingCustomers;
    const q = customerSearch.toLowerCase();
    return existingCustomers.filter((c) => {
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      const phone = (c.phone ?? '').toLowerCase();
      const email = (c.email ?? '').toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [existingCustomers, customerSearch]);

  const [vehicleSearch, setVehicleSearch] = useState('');

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return customerVehicles;
    const q = vehicleSearch.toLowerCase();
    return customerVehicles.filter((v) => {
      const name = `${v.make ?? ''} ${v.model ?? ''} ${v.year ?? ''}`.toLowerCase();
      const plate = (v.plate_number ?? '').toLowerCase();
      const vin = (v.vin ?? '').toLowerCase();
      return name.includes(q) || plate.includes(q) || vin.includes(q);
    });
  }, [customerVehicles, vehicleSearch]);

  // Load existing customers on mount
  useEffect(() => {
    async function fetchCustomers() {
      setLoadingCustomers(true);
      try {
        const { data } = await apiClient.get('/customers', { params: { per_page: 200 } });
        setExistingCustomers(data?.data ?? []);
      } catch (err) {
        console.error("Failed to load customers", err);
      } finally {
        setLoadingCustomers(false);
      }
    }
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (bays && bays.length > 0 && !form.bay_id) {
      setForm((f) => ({ ...f, bay_id: String(bays[0].bay_id) }));
    }
  }, [bays]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Handle select customer change
  const handleCustomerSelectChange = (e) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    setIsNewVehicle(false);

    if (custId) {
      const cust = existingCustomers.find((c) => String(c.customer_id) === custId);
      if (cust) {
        const fullName = `${cust.first_name ?? ''} ${cust.last_name ?? ''}`.trim() || cust.name || 'Unnamed';
        setForm((f) => ({
          ...f,
          customer_id: custId,
          customer_first_name: cust.first_name ?? '',
          customer_last_name: cust.last_name ?? '',
          customer_email: cust.email ?? '',
          customer_phone: cust.phone ?? '',
          customer_address: cust.address ?? '',
          vehicle_id: '',
          vehicle_make: '',
          vehicle_model: '',
          vehicle_vin: '',
        }));
        setCustomerVehicles(cust.vehicles ?? []);

        if (cust.vehicles && cust.vehicles.length > 0) {
          const firstV = cust.vehicles[0];
          setSelectedVehicleId(String(firstV.vehicle_id));
          setForm((f) => ({
            ...f,
            vehicle_id: String(firstV.vehicle_id),
            vehicle_make: firstV.make ?? '',
            vehicle_model: firstV.model ?? '',
            vehicle_year: firstV.year ?? todayStr.slice(0, 4),
            vehicle_plate_number: firstV.plate_number ?? '',
            vehicle_vin: firstV.vin ?? '',
            vehicle_mileage: firstV.mileage ?? '',
          }));
        } else {
          setCustomerVehicles([]);
          setSelectedVehicleId('');
          setIsNewVehicle(true);
        }
      }
    } else {
      setForm((f) => ({
        ...f,
        customer_id: '',
        customer_first_name: '',
        customer_last_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        vehicle_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: todayStr.slice(0, 4),
        vehicle_plate_number: '',
        vehicle_vin: '',
        vehicle_mileage: '',
      }));
      setCustomerVehicles([]);
      setSelectedVehicleId('');
    }
  };

  // Toggle between selecting existing and adding a new customer
  const handleToggleNewCustomer = () => {
    const next = !isNewCustomer;
    setIsNewCustomer(next);
    if (next) {
      setSelectedCustomerId('');
      setForm((f) => ({
        ...f,
        customer_id: '',
        customer_first_name: '',
        customer_last_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        vehicle_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: todayStr.slice(0, 4),
        vehicle_plate_number: '',
        vehicle_vin: '',
        vehicle_mileage: '',
      }));
      setCustomerVehicles([]);
      setIsNewVehicle(true);
    } else {
      setForm((f) => ({
        ...f,
        customer_first_name: '',
        customer_last_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        vehicle_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: todayStr.slice(0, 4),
        vehicle_plate_number: '',
        vehicle_vin: '',
        vehicle_mileage: '',
      }));
      setIsNewVehicle(false);
    }
  };

  // Handle select vehicle change
  const handleVehicleSelectChange = (e) => {
    const vId = e.target.value;
    setSelectedVehicleId(vId);
    if (vId) {
      const v = customerVehicles.find((item) => String(item.vehicle_id) === vId);
      if (v) {
        setForm((f) => ({
          ...f,
          vehicle_id: vId,
          vehicle_make: v.make ?? '',
          vehicle_model: v.model ?? '',
          vehicle_year: v.year ?? todayStr.slice(0, 4),
          vehicle_plate_number: v.plate_number ?? '',
          vehicle_vin: v.vin ?? '',
          vehicle_mileage: v.mileage ?? '',
        }));
      }
    } else {
      setForm((f) => ({
        ...f,
        vehicle_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: todayStr.slice(0, 4),
        vehicle_plate_number: '',
        vehicle_vin: '',
        vehicle_mileage: '',
      }));
    }
  };

  // Toggle between selecting existing and adding a new vehicle
  const handleToggleNewVehicle = () => {
    const next = !isNewVehicle;
    setIsNewVehicle(next);
    if (next) {
      setSelectedVehicleId('');
      setForm((f) => ({
        ...f,
        vehicle_id: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: todayStr.slice(0, 4),
        vehicle_plate_number: '',
        vehicle_vin: '',
        vehicle_mileage: '',
      }));
    } else {
      if (customerVehicles.length > 0) {
        const firstV = customerVehicles[0];
        setSelectedVehicleId(String(firstV.vehicle_id));
        setForm((f) => ({
          ...f,
          vehicle_id: String(firstV.vehicle_id),
          vehicle_make: firstV.make ?? '',
          vehicle_model: firstV.model ?? '',
          vehicle_year: firstV.year ?? todayStr.slice(0, 4),
          vehicle_plate_number: firstV.plate_number ?? '',
          vehicle_vin: firstV.vin ?? '',
          vehicle_mileage: firstV.mileage ?? '',
        }));
      }
    }
  };

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
      await createAppointment.mutateAsync({
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        customer_first_name: isNewCustomer ? form.customer_first_name : undefined,
        customer_last_name: isNewCustomer ? form.customer_last_name : undefined,
        customer_email: isNewCustomer ? form.customer_email : undefined,
        customer_phone: isNewCustomer ? form.customer_phone : undefined,
        customer_address: isNewCustomer ? form.customer_address : undefined,

        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
        vehicle_make: (isNewVehicle || isNewCustomer) ? form.vehicle_make : undefined,
        vehicle_model: (isNewVehicle || isNewCustomer) ? form.vehicle_model : undefined,
        vehicle_year: (isNewVehicle || isNewCustomer) ? Number(form.vehicle_year) : undefined,
        vehicle_plate_number: (isNewVehicle || isNewCustomer) ? form.vehicle_plate_number : undefined,
        vehicle_vin: (isNewVehicle || isNewCustomer) ? form.vehicle_vin : undefined,
        vehicle_mileage: (isNewVehicle || isNewCustomer) && form.vehicle_mileage ? Number(form.vehicle_mileage) : undefined,

        technician_name: form.technician_name,
        service_type: form.service_types.join(', '),
        bay_id: form.bay_id ? Number(form.bay_id) : null,
        scheduled_start: form.scheduled_start,
        scheduled_end: form.scheduled_end,
        is_walkin: form.is_walkin,
      });
      navigate('/appointments');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not book this appointment.');
    }
  }

  const DASHBOARD_BY_ROLE = {
    owner: '/owner/dashboard',
    admin: '/admin/dashboard',
    technician: '/technician/dashboard',
    customer: '/customer/dashboard',
    supervisor: '/hr/dashboard',
    hr: '/hr/dashboard',
    finance: '/finance/dashboard',
    manager: '/manager/dashboard',
    employee: '/dashboard',
  };
  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = [
    {
      label: 'Navigation',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
        { label: 'Appointments', icon: CalendarDays, path: '/appointments' },
      ],
    },
  ];

  return (
    <DashboardLayout navSections={navSections} pageTitle="Create New Appointment" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-3xl">
        <button
          onClick={() => navigate('/appointments')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </button>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-semibold tracking-tight mb-6 pb-4 border-b border-border">
            Appointment Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer & Vehicle Grid */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* Customer Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Customer Information <span className="text-destructive">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={handleToggleNewCustomer}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    style={{ color: 'hsl(84 25% 35%)' }}
                  >
                    {isNewCustomer ? (
                      <>
                        <X className="h-3.5 w-3.5" /> Select Existing Customer
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" /> Register New Customer
                      </>
                    )}
                  </button>
                </div>

                {isNewCustomer ? (
                  <div className="space-y-4 border border-border/60 p-4 rounded-xl bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">First Name *</Label>
                        <Input
                          type="text"
                          placeholder="e.g. John"
                          value={form.customer_first_name}
                          onChange={(e) => set('customer_first_name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Last Name *</Label>
                        <Input
                          type="text"
                          placeholder="e.g. Doe"
                          value={form.customer_last_name}
                          onChange={(e) => set('customer_last_name', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Email *</Label>
                        <Input
                          type="email"
                          placeholder="e.g. john@example.com"
                          value={form.customer_email}
                          onChange={(e) => set('customer_email', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Phone</Label>
                        <Input
                          type="tel"
                          placeholder="e.g. +251..."
                          value={form.customer_phone}
                          onChange={(e) => set('customer_phone', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">Address</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Addis Ababa, Bole"
                        value={form.customer_address}
                        onChange={(e) => set('customer_address', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search customer by name or phone..."
                        className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                    </div>

                    {/* Customer cards list — only shown when typing */}
                    {customerSearch.trim().length > 0 && (
                      <div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border/50">
                        {loadingCustomers ? (
                          <div className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading customers...
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            No customers matching &quot;{customerSearch}&quot;
                          </div>
                        ) : (
                          filteredCustomers.map((c) => {
                            const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unnamed';
                            const isSelected = String(c.customer_id) === selectedCustomerId;
                            return (
                              <button
                                key={c.customer_id}
                                type="button"
                                onClick={() => handleCustomerSelectChange({ target: { value: String(c.customer_id) } })}
                                className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors hover:bg-muted/60"
                                style={{ background: isSelected ? 'hsl(84 20% 93%)' : undefined }}
                              >
                                <div>
                                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                                    {isSelected && <UserCheck className="h-3.5 w-3.5 text-green-600" />}
                                    {name}
                                  </p>
                                  {(c.phone || c.email) && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {c.phone} {c.phone && c.email ? '·' : ''} {c.email}
                                    </p>
                                  )}
                                </div>
                                {c.vehicles && c.vehicles.length > 0 && (
                                  <span className="text-[11px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground flex items-center gap-1 shrink-0 ml-2">
                                    <Car className="h-3 w-3" /> {c.vehicles.length} vehicle{c.vehicles.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* Show selected summary */}
                    {selectedCustomerId && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-medium text-foreground">{form.customer_first_name} {form.customer_last_name}</span> selected
                        <button type="button" onClick={() => { setSelectedCustomerId(''); setForm(f => ({ ...f, customer_id: '' })); }} className="ml-1 text-red-500 hover:underline">Clear</button>
                      </p>
                    )}

                    {/* Hidden required sentinel */}
                    <input type="text" className="sr-only" value={selectedCustomerId} required readOnly onChange={() => {}} />
                  </div>
                )}
              </div>

              {/* Vehicle Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vehicle Information <span className="text-destructive">*</span>
                  </Label>
                  {!isNewCustomer && selectedCustomerId && (
                    <button
                      type="button"
                      onClick={handleToggleNewVehicle}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                      style={{ color: 'hsl(84 25% 35%)' }}
                    >
                      {isNewVehicle ? (
                        <>
                          <X className="h-3.5 w-3.5" /> Select Existing Vehicle
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add New Vehicle
                        </>
                      )}
                    </button>
                  )}
                </div>

                {isNewVehicle || isNewCustomer ? (
                  <div className="space-y-4 border border-border/60 p-4 rounded-xl bg-muted/20">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Make *</Label>
                        <Input
                          type="text"
                          placeholder="e.g. Toyota"
                          value={form.vehicle_make}
                          onChange={(e) => set('vehicle_make', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Model *</Label>
                        <Input
                          type="text"
                          placeholder="e.g. Hilux"
                          value={form.vehicle_model}
                          onChange={(e) => set('vehicle_model', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Year *</Label>
                        <Input
                          type="number"
                          placeholder="2020"
                          value={form.vehicle_year}
                          onChange={(e) => set('vehicle_year', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Plate Number</Label>
                        <Input
                          type="text"
                          placeholder="e.g. AA-3B123"
                          value={form.vehicle_plate_number}
                          onChange={(e) => set('vehicle_plate_number', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground uppercase">Mileage</Label>
                        <Input
                          type="number"
                          placeholder="e.g. 85000"
                          value={form.vehicle_mileage}
                          onChange={(e) => set('vehicle_mileage', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase">VIN *</Label>
                      <Input
                        type="text"
                        placeholder="17 character VIN"
                        value={form.vehicle_vin}
                        onChange={(e) => set('vehicle_vin', e.target.value.toUpperCase())}
                        maxLength={17}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!selectedCustomerId ? (
                      <div className="py-5 text-center text-sm text-muted-foreground rounded-lg border border-dashed border-border">
                        Select a customer first to see their vehicles
                      </div>
                    ) : customerVehicles.length === 0 ? (
                      <div className="py-5 text-center text-sm text-muted-foreground rounded-lg border border-dashed border-border">
                        No vehicles found for this customer
                      </div>
                    ) : (
                      <>
                        {/* Search input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search by make, model, plate..."
                            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                          />
                        </div>

                        {/* Vehicle cards — only shown when typing */}
                        {vehicleSearch.trim().length > 0 && (
                          <div className="rounded-lg border border-border divide-y divide-border/50">
                            {filteredVehicles.length === 0 ? (
                              <div className="py-5 text-center text-sm text-muted-foreground">
                                No vehicles matching &quot;{vehicleSearch}&quot;
                              </div>
                            ) : (
                              filteredVehicles.map((v) => {
                                const isSelected = String(v.vehicle_id) === selectedVehicleId;
                                return (
                                  <button
                                    key={v.vehicle_id}
                                    type="button"
                                    onClick={() => handleVehicleSelectChange({ target: { value: String(v.vehicle_id) } })}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/60"
                                    style={{ background: isSelected ? 'hsl(84 20% 93%)' : undefined }}
                                  >
                                    <div
                                      className="h-8 w-8 rounded-md flex items-center justify-center shrink-0"
                                      style={{ background: isSelected ? 'hsl(84 25% 40%)' : 'hsl(220 14% 90%)' }}
                                    >
                                      <Car className="h-4 w-4" style={{ color: isSelected ? 'white' : 'hsl(220 12% 50%)' }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground">
                                        {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {v.plate_number ? `Plate: ${v.plate_number}` : 'No plate'}{v.vin ? ` · VIN: ${v.vin}` : ''}
                                      </p>
                                    </div>
                                    {isSelected && (
                                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                                        Selected
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Show selected vehicle summary */}
                    {(() => {
                      const selectedVehicle = customerVehicles.find(v => String(v.vehicle_id) === selectedVehicleId);
                      if (!selectedVehicle) return null;
                      return (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                          <Car className="h-3.5 w-3.5 text-green-600" />
                          <span className="font-medium text-foreground">
                            {selectedVehicle.make} {selectedVehicle.model} {selectedVehicle.plate_number ? `(${selectedVehicle.plate_number})` : ''}
                          </span> selected
                          <button type="button" onClick={() => setSelectedVehicleId('')} className="ml-1 text-red-500 hover:underline">Clear</button>
                        </p>
                      );
                    })()}

                    {/* Hidden required sentinel */}
                    <input type="text" className="sr-only" value={selectedVehicleId} required readOnly onChange={() => {}} />
                  </div>
                )}
              </div>

            </div>

            {/* Technician selection */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Technician Assignment
                  </Label>
                  {technicians && technicians.length > 0 && (
                    <select
                      onChange={(e) => set('technician_name', e.target.value)}
                      value=""
                      className="text-xs border border-input rounded px-2 py-0.5 bg-background text-foreground cursor-pointer"
                    >
                      <option value="" disabled>Select registered tech...</option>
                      {technicians.map((t) => (
                        <option key={t.user_id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <Input
                  type="text"
                  list="technicians-list"
                  placeholder="e.g. Samuel Alemu (type or select above)"
                  value={form.technician_name}
                  onChange={(e) => set('technician_name', e.target.value)}
                />
                <datalist id="technicians-list">
                  {technicians?.map((t) => (
                    <option key={t.user_id} value={t.name} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Service Types Checklist */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Service Type Checklist <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {SERVICE_TYPES.map((service) => {
                  const checked = form.service_types.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`flex items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm text-left transition-all ${
                        checked
                          ? 'border-transparent bg-[hsl(84_25%_30%)] text-white'
                          : 'border-border bg-background text-foreground hover:border-[hsl(84_25%_30%)] hover:bg-muted'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                          checked ? 'border-transparent bg-white' : 'border-input bg-background'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3 text-[hsl(84_25%_30%)]" strokeWidth={3} />}
                      </span>
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bay & Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Bay
                </Label>
                <select
                  value={form.bay_id}
                  onChange={(e) => set('bay_id', e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {bays?.map((b) => (
                    <option key={b.bay_id} value={b.bay_id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_start}
                  onChange={(e) => set('scheduled_start', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  End Date & Time
                </Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_end}
                  onChange={(e) => set('scheduled_end', e.target.value)}
                />
              </div>
            </div>

            {/* Walk-in toggle */}
            <label className="flex items-center gap-2.5 text-sm cursor-pointer select-none">
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                  form.is_walkin ? 'border-transparent bg-[hsl(84_25%_30%)]' : 'border-input bg-background'
                }`}
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
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="px-6"
                onClick={() => navigate('/appointments')}
                disabled={createAppointment.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-8 text-white"
                style={{ background: 'hsl(84 25% 30%)' }}
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending ? 'Booking…' : 'Book Appointment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
