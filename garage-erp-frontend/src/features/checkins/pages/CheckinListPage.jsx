import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ClipboardCheck, Clock, CheckCircle, AlertCircle, Plus, Search, Calendar, 
  Car, User, ArrowRight, ShieldCheck, FileText, Key, Fuel, Gauge, RefreshCw, LayoutDashboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import apiClient from '@/services/http/axios';
import { useQuery } from '@tanstack/react-query';
import { getNavSections } from '@/layouts/navSections';

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function CheckinListPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState('checked_in'); // 'checked_in' | 'not_checked_in'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = getNavSections(role);

  // Fetch today's checkins and expected appointments
  const { data: statusData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['checkin-today-status', selectedDate],
    queryFn: async () => {
      const res = await apiClient.get('/checkins/today-status', {
        params: { date: selectedDate }
      });
      return res.data;
    },
  });

  const checkedInList = statusData?.checked_in || [];
  const expectedList = statusData?.expected_today || [];
  const summary = statusData?.summary || {
    total_checked_in: 0,
    total_expected: 0,
    inspections_completed: 0,
    work_orders_created: 0,
  };

  const [creatingWoCheckinId, setCreatingWoCheckinId] = useState(null);

  const handleCreateWorkOrderDirect = async (checkinId) => {
    setCreatingWoCheckinId(checkinId);
    try {
      const res = await apiClient.post(`/checkins/${checkinId}/work-order`, {});
      const woId = res.data?.work_order_id || res.data?.work_order?.work_order_id || res.data?.id;
      if (woId) {
        navigate(`/work-orders/${woId}`);
      } else {
        navigate('/work-orders');
      }
    } catch (err) {
      const existingWoId = err.response?.data?.work_order?.work_order_id;
      if (existingWoId) {
        navigate(`/work-orders/${existingWoId}`);
      } else {
        alert(err.response?.data?.message || err.message || 'Failed to create work order');
      }
    } finally {
      setCreatingWoCheckinId(null);
    }
  };

  // Filter lists based on search term
  const filteredCheckedIn = checkedInList.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const ciId = `ci-${c.checkin_id}`.toLowerCase();
    const custName = `${c.customer?.first_name || ''} ${c.customer?.last_name || ''}`.toLowerCase();
    const plate = (c.vehicle?.plate_number || '').toLowerCase();
    const keyTag = (c.key_tag_number || '').toLowerCase();
    return ciId.includes(term) || custName.includes(term) || plate.includes(term) || keyTag.includes(term);
  });

  const filteredExpected = expectedList.filter(a => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const custName = `${a.customer?.first_name || ''} ${a.customer?.last_name || ''}`.toLowerCase();
    const plate = (a.vehicle?.plate_number || '').toLowerCase();
    const service = (a.service_type || '').toLowerCase();
    return custName.includes(term) || plate.includes(term) || service.includes(term);
  });

  return (
    <DashboardLayout navSections={navSections} pageTitle="Vehicle Check-In Management" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vehicle Check-In Management</h1>
            <p className="text-sm text-muted-foreground">
              Monitor checked-in vehicles at the garage and today's expected appointments awaiting check-in.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-1.5 shadow-sm text-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/checkins/new')}
              style={{ background: 'hsl(84 25% 30%)' }}
              className="text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              + New Walk-In Check-In
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Checked In Vehicles</p>
                  <p className="text-2xl font-bold text-foreground">{summary.total_checked_in}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Not Checked In (Expected)</p>
                  <p className="text-2xl font-bold text-amber-700">{summary.total_expected}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inspections Completed</p>
                  <p className="text-2xl font-bold text-blue-700">{summary.inspections_completed}</p>
                </div>
                <ShieldCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Work Orders Created</p>
                  <p className="text-2xl font-bold text-purple-700">{summary.work_orders_created}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selection & Search */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'checked_in' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('checked_in')}
              style={activeTab === 'checked_in' ? { background: 'hsl(84 25% 30%)' } : {}}
              className="text-xs font-semibold"
            >
              <ClipboardCheck className="w-4 h-4 mr-1.5" />
              Checked-In Vehicles ({checkedInList.length})
            </Button>
            <Button
              variant={activeTab === 'not_checked_in' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('not_checked_in')}
              style={activeTab === 'not_checked_in' ? { background: 'hsl(84 25% 30%)' } : {}}
              className="text-xs font-semibold"
            >
              <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
              Today's Appointments - Not Checked In ({expectedList.length})
            </Button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, vehicle, plate, key tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* TAB 1: Checked In Vehicles */}
        {activeTab === 'checked_in' && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-left">Check-In # / Tag</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Vehicle Details</th>
                    <th className="px-4 py-3 text-left">Plate #</th>
                    <th className="px-4 py-3 text-left">Intake Mileage & Fuel</th>
                    <th className="px-4 py-3 text-left">Complaint / Request</th>
                    <th className="px-4 py-3 text-left">Inspection & Status</th>
                    <th className="px-4 py-3 text-left">Work Order</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-xs">Loading checked-in vehicles...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCheckedIn.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                        <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                        <p className="font-semibold text-foreground">No checked-in vehicles found</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          No vehicles checked in for {selectedDate}. Click "New Walk-In Check-In" to start intake.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCheckedIn.map((checkin) => {
                      const isInspected = checkin.checkin_status === 'completed' || checkin.inspection_completed_at;
                      const hasWorkOrder = !!checkin.work_order_id;

                      return (
                        <tr key={checkin.checkin_id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 text-xs font-mono font-bold">
                            <div className="flex items-center gap-1.5">
                              <span className="text-primary font-semibold">CI-{checkin.checkin_id}</span>
                            </div>
                            {checkin.key_tag_number && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                                <Key className="w-2.5 h-2.5" /> Tag: {checkin.key_tag_number}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-foreground">
                              {checkin.customer?.first_name} {checkin.customer?.last_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{checkin.customer?.phone || 'No phone'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-foreground">
                              {checkin.vehicle ? `${checkin.vehicle.year || ''} ${checkin.vehicle.make || ''} ${checkin.vehicle.model || ''}`.trim() : 'N/A'}
                            </div>
                            {checkin.vehicle?.vin && (
                              <div className="text-[10px] text-muted-foreground font-mono">VIN: {checkin.vehicle.vin}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border font-semibold">
                              {checkin.vehicle?.plate_number || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Gauge className="w-3.5 h-3.5 text-primary" />
                              <span>{checkin.mileage_in ? `${Number(checkin.mileage_in).toLocaleString()} km` : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                              <Fuel className="w-3 h-3 text-amber-600" />
                              <span>Fuel: {checkin.fuel_level || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <p className="line-clamp-2 text-xs text-muted-foreground" title={checkin.customer_complaint}>
                              {checkin.customer_complaint || 'Standard Service Intake'}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            {isInspected ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Inspection Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Intake / Pending QC
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            {hasWorkOrder ? (
                              <Link
                                to={`/work-orders/${checkin.work_order_id}`}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:underline"
                              >
                                WO #{checkin.work_order_id}
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">None Created</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            {!hasWorkOrder ? (
                              <Button
                                size="sm"
                                onClick={() => handleCreateWorkOrderDirect(checkin.checkin_id)}
                                disabled={creatingWoCheckinId === checkin.checkin_id}
                                style={{ background: 'hsl(84 25% 30%)' }}
                                className="text-xs text-white font-semibold"
                              >
                                {creatingWoCheckinId === checkin.checkin_id ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3 mr-1" />
                                    Create Work Order
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/work-orders/${checkin.work_order_id}`)}
                                className="text-xs"
                              >
                                View Work Order
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Today's Appointments - Not Checked In */}
        {activeTab === 'not_checked_in' && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-amber-50/50 text-xs font-semibold uppercase tracking-wider text-amber-900">
                    <th className="px-4 py-3 text-left">Scheduled Start</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Vehicle Details</th>
                    <th className="px-4 py-3 text-left">Plate #</th>
                    <th className="px-4 py-3 text-left">Service Type Requested</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-xs">Loading expected appointments...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredExpected.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <CheckCircle className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                        <p className="font-semibold text-foreground">No pending appointments awaiting check-in for {selectedDate}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          All expected appointments for this date have either been checked in or completed.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredExpected.map((apt) => {
                      const startTime = apt.scheduled_start ? new Date(apt.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

                      return (
                        <tr key={apt.appointment_id} className="hover:bg-amber-50/20 transition-colors">
                          <td className="px-4 py-3.5 font-mono font-bold text-amber-900">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{startTime}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-foreground">
                              {apt.customer?.first_name} {apt.customer?.last_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{apt.customer?.phone || 'No phone'}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-foreground">
                              {apt.vehicle ? `${apt.vehicle.year || ''} ${apt.vehicle.make || ''} ${apt.vehicle.model || ''}`.trim() : 'N/A'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border font-semibold">
                              {apt.vehicle?.plate_number || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded border border-primary/20">
                              {apt.service_type || 'General Service'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {apt.status === 'booked' ? 'Booked' : 'Confirmed'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/checkins/new?appointmentId=${apt.appointment_id}&vehicleId=${apt.vehicle_id}&customerId=${apt.customer_id}`)}
                              style={{ background: 'hsl(84 25% 30%)' }}
                              className="text-xs text-white font-semibold"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5 mr-1" />
                              Check In Now
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
