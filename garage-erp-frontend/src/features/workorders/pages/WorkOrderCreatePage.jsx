import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, User, Car, FileText, AlertCircle, LayoutDashboard, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useCreateWorkOrder } from '../hooks/useWorkOrders';
import { useGetCheckin } from '@/features/checkins/hooks/useCheckins';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/http/axios';
import { getNavSections } from '@/layouts/navSections';

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function WorkOrderCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role } = useAuthStore();
  const checkinId = searchParams.get('checkinId');
  const customerIdParam = searchParams.get('customerId');

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = getNavSections(role);

  const [form, setForm] = useState({
    checkin_id: checkinId || '',
    vehicle_id: '',
    customer_id: customerIdParam || '',
    branch_id: user?.branch_id || '',
    supervisor_id: user?.user_id || '',
    service_advisor_id: '',
    priority: 'normal',
    customer_complaint: '',
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createWorkOrder = useCreateWorkOrder();
  const { data: checkin, isLoading: isLoadingCheckin } = useGetCheckin(checkinId);

  // Search customers for manual work order
  const { data: customersData } = useQuery({
    queryKey: ['customers-search', customerSearch],
    queryFn: async () => {
      const res = await apiClient.get('/customers', { params: { search: customerSearch, per_page: 10 } });
      return res.data?.data || res.data || [];
    },
    enabled: !checkinId && customerSearch.length > 1,
  });

  // Fetch selected customer detail including vehicles
  const { data: customerDetail } = useQuery({
    queryKey: ['customer-detail', form.customer_id],
    queryFn: async () => {
      const res = await apiClient.get(`/customers/${form.customer_id}`);
      return res.data;
    },
    enabled: !!form.customer_id && !checkinId,
  });

  useEffect(() => {
    if (checkin) {
      setForm(prev => ({
        ...prev,
        checkin_id: checkin.checkin_id,
        vehicle_id: checkin.vehicle_id,
        customer_id: checkin.customer_id,
        branch_id: checkin.branch_id || user?.branch_id || 1,
        supervisor_id: user?.user_id || '',
      }));
    }
  }, [checkin, user]);

  useEffect(() => {
    if (customerDetail) {
      setSelectedCustomer(customerDetail);
      if (customerDetail.vehicles && customerDetail.vehicles.length > 0 && !form.vehicle_id) {
        setForm(prev => ({ ...prev, vehicle_id: customerDetail.vehicles[0].vehicle_id }));
      }
    }
  }, [customerDetail, form.vehicle_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.customer_id) {
      setError('Please select a customer.');
      return;
    }
    if (!form.vehicle_id) {
      setError('Please select a vehicle.');
      return;
    }

    try {
      const workOrder = await createWorkOrder.mutateAsync({
        checkin_id: form.checkin_id ? Number(form.checkin_id) : null,
        vehicle_id: Number(form.vehicle_id),
        customer_id: Number(form.customer_id),
        branch_id: form.branch_id ? Number(form.branch_id) : (user?.branch_id || 1),
        supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : null,
        service_advisor_id: form.service_advisor_id ? Number(form.service_advisor_id) : null,
        priority: form.priority,
        is_manual: !form.checkin_id,
      });

      const woId = workOrder?.work_order_id || workOrder?.work_order?.work_order_id || workOrder?.id;
      if (woId) {
        navigate(`/work-orders/${woId}`);
      } else {
        navigate('/work-orders');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create work order');
    }
  };

  if (isLoadingCheckin && checkinId) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Create Work Order" roleLabel={user?.username ?? 'Staff'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading check-in information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navSections={navSections} pageTitle="Create Work Order" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Work Order</h1>
            <p className="text-muted-foreground">Create a new work order from vehicle check-in</p>
          </div>
        </div>

        {success ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Work Order Created Successfully!</h3>
                <p className="text-muted-foreground">Redirecting to work order details...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Check-In Information */}
            {checkin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Check-In Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Check-In ID</Label>
                      <p className="font-medium">#{checkin.checkin_id}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Date</Label>
                      <p className="font-medium">{new Date(checkin.checked_in_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Mileage</Label>
                      <p className="font-medium">{checkin.mileage_in?.toLocaleString() || 'N/A'} km</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Fuel Level</Label>
                      <p className="font-medium">{checkin.fuel_level || 'N/A'}</p>
                    </div>
                  </div>
                  {checkin.customer_complaint && (
                    <div className="pt-4 border-t">
                      <Label className="text-muted-foreground text-sm">Customer Complaint</Label>
                      <p className="text-sm mt-1 bg-yellow-50 p-3 rounded-md border border-yellow-200">
                        {checkin.customer_complaint}
                      </p>
                    </div>
                  )}
                  {checkin.inspection_notes && (
                    <div className="pt-4 border-t">
                      <Label className="text-muted-foreground text-sm">Inspection Notes</Label>
                      <p className="text-sm mt-1">{checkin.inspection_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Manual Customer & Vehicle Selection (when creating without checkin) */}
            {!checkin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer & Vehicle Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer search & select */}
                  <div className="space-y-2">
                    <Label htmlFor="customer_search">Search Customer *</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="customer_search"
                        placeholder="Type customer name or phone..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {customersData && customersData.length > 0 && customerSearch.length > 1 && !selectedCustomer && (
                      <div className="border rounded-md divide-y max-h-48 overflow-y-auto bg-card shadow-sm">
                        {customersData.map((cust) => (
                          <div
                            key={cust.customer_id}
                            onClick={() => {
                              setSelectedCustomer(cust);
                              setForm(prev => ({ ...prev, customer_id: cust.customer_id, vehicle_id: cust.vehicles?.[0]?.vehicle_id || '' }));
                              setCustomerSearch(`${cust.first_name} ${cust.last_name}`);
                            }}
                            className="p-2.5 hover:bg-muted cursor-pointer text-sm flex justify-between items-center"
                          >
                            <div>
                              <span className="font-medium text-foreground">{cust.first_name} {cust.last_name}</span>
                              <span className="text-xs text-muted-foreground ml-2">{cust.phone}</span>
                            </div>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                              {cust.vehicles?.length || 0} vehicles
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected customer summary */}
                  {selectedCustomer && (
                    <div className="p-3 bg-muted/50 rounded-md border text-sm flex justify-between items-center">
                      <div>
                        <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone} • {selectedCustomer.email || 'No email'}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                          setForm(prev => ({ ...prev, customer_id: '', vehicle_id: '' }));
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  {/* Vehicle selection */}
                  {selectedCustomer && (
                    <div className="space-y-2">
                      <Label htmlFor="vehicle_select">Select Vehicle *</Label>
                      {selectedCustomer.vehicles && selectedCustomer.vehicles.length > 0 ? (
                        <select
                          id="vehicle_select"
                          value={form.vehicle_id}
                          onChange={(e) => setForm(prev => ({ ...prev, vehicle_id: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                        >
                          <option value="">Select a vehicle</option>
                          {selectedCustomer.vehicles.map((v) => (
                            <option key={v.vehicle_id} value={v.vehicle_id}>
                              {v.year} {v.make} {v.model} ({v.plate_number || 'No plate'})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded">
                          This customer has no registered vehicles. Please register a vehicle under customer management first.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Checkin info cards if created from checkin */}
            {checkin?.customer && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Name</Label>
                      <p className="font-medium">
                        {checkin.customer.first_name} {checkin.customer.last_name}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Phone</Label>
                      <p className="font-medium">{checkin.customer.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Email</Label>
                      <p className="font-medium">{checkin.customer.email || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {checkin?.vehicle && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Vehicle</Label>
                      <p className="font-medium">
                        {checkin.vehicle.year} {checkin.vehicle.make} {checkin.vehicle.model}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">Plate Number</Label>
                      <p className="font-medium">{checkin.vehicle.plate_number || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground text-sm">VIN</Label>
                      <p className="font-medium">{checkin.vehicle.vin || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Order Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Work Order Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <select
                        id="priority"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                      >
                        {PRIORITY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supervisor_id">Supervisor</Label>
                      <Input
                        id="supervisor_id"
                        value={user?.username || 'Current Staff'}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">Assigned to current user session</p>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/work-orders')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createWorkOrder.isPending}
                      style={{ background: 'hsl(84 25% 30%)' }}
                      className="text-white"
                    >
                      {createWorkOrder.isPending ? 'Creating...' : 'Create Work Order'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}