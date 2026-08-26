import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, CheckCircle, AlertCircle, User, Car, Calendar, LayoutDashboard, FileText, ArrowRight, ShieldCheck, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import apiClient, { ensureCsrfCookie } from '@/services/http/axios';
import { useQuery } from '@tanstack/react-query';

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function WorkOrderFromCheckinPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [creatingWorkOrder, setCreatingWorkOrder] = useState(null);

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = [
    {
      label: 'Navigation',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
        { label: 'Work Orders', icon: Clock, path: '/work-orders' },
      ],
    },
  ];

  // Fetch real checkins from the API
  const { data: checkinsData, isLoading, error: fetchError, refetch } = useQuery({
    queryKey: ['completed-checkins'],
    queryFn: async () => {
      const response = await apiClient.get('/checkins', { params: { per_page: 50 } });
      const items = response.data?.data || response.data || [];
      return Array.isArray(items) ? items : [];
    },
  });

  const completedCheckins = Array.isArray(checkinsData) ? checkinsData : [];

  const filteredCheckins = completedCheckins.filter(checkin => {
    const matchesSearch = searchTerm === '' || 
      `CI-${checkin.checkin_id}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (checkin.key_tag_number && checkin.key_tag_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checkin.customer?.first_name && checkin.customer.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checkin.customer?.last_name && checkin.customer.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (checkin.vehicle?.plate_number && checkin.vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const hasWorkOrder = !!checkin.work_order_id;
    const isCompleted = checkin.checkin_status === 'completed' || checkin.inspection_completed_at;

    if (statusFilter === 'without_wo') return !hasWorkOrder && matchesSearch;
    if (statusFilter === 'with_wo') return hasWorkOrder && matchesSearch;
    if (statusFilter === 'completed') return isCompleted && matchesSearch;
    
    return matchesSearch;
  });

  const getQuotationBadge = (checkin) => {
    if (!checkin.has_quotation) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          No Quotation
        </span>
      );
    }
    if (checkin.quotation_status === 'approved') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Approved
        </span>
      );
    }
    if (checkin.quotation_status === 'awaiting_approval') {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Awaiting Approval
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {checkin.quotation_status}
      </span>
    );
  };

  const canCreateWorkOrder = (checkin) => {
    return checkin.inspection_status === 'completed' && 
           checkin.quotation_status === 'approved';
  };

  const handleCreateWorkOrder = async (checkin) => {
    setErrorMessage(null);
    setCreatingWorkOrder(checkin.checkin_id);
    
    try {
      await ensureCsrfCookie();
      const response = await apiClient.post(`/checkins/${checkin.checkin_id}/work-order`, {});
      
      const woId = response.data?.work_order_id || response.data?.work_order?.work_order_id || response.data?.id;
      if (woId) {
        navigate(`/work-orders/${woId}`);
      } else {
        navigate('/work-orders');
      }
    } catch (error) {
      console.error('API error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create work order. Please try again.';
      setErrorMessage(errorMessage);
    } finally {
      setCreatingWorkOrder(null);
    }
  };

  const handleCreateQuotation = (checkin) => {
    navigate(`/quotations/new?checkinId=${checkin.checkin_id}`);
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Create Work Order from Check-In" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')}>
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back to Work Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Work Order from Check-In</h1>
            <p className="text-muted-foreground">
              Select a completed vehicle check-in to create a work order
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Check-Ins</p>
                  <p className="text-2xl font-bold">{completedCheckins.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">
                    {completedCheckins.filter(c => c.quotation_status === 'approved').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Awaiting Approval</p>
                  <p className="text-2xl font-bold">
                    {completedCheckins.filter(c => c.quotation_status === 'awaiting_approval').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No Quotation</p>
                  <p className="text-2xl font-bold">
                    {completedCheckins.filter(c => !c.has_quotation).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Check-In#, customer, vehicle, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="awaiting">Awaiting Approval</option>
              <option value="no_quotation">No Quotation</option>
            </select>
          </div>
        </div>

        {/* Check-Ins Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">Check-In #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Plate</th>
                  <th className="px-4 py-3 text-left">Mileage In</th>
                  <th className="px-4 py-3 text-left">Complaint / Request</th>
                  <th className="px-4 py-3 text-left">Inspection & Signature</th>
                  <th className="px-4 py-3 text-left">Work Order</th>
                  <th className="px-4 py-3 text-left">Checked In</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm">Loading check-ins...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredCheckins.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                      <FileCheck className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="font-medium text-foreground">No check-ins found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Completed vehicle check-ins will appear here ready for work order creation.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCheckins.map((checkin) => {
                    const hasWorkOrder = !!checkin.work_order_id;
                    const isInspectionPassed = checkin.checkin_status === 'completed' || checkin.checkin_status === 'inspection_completed' || checkin.inspection_completed_at;
                    const hasSignature = !!checkin.signature_file || !!checkin.customer_signed_at;

                    return (
                      <tr key={checkin.checkin_id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3.5 text-sm font-semibold font-mono">
                          CI-{checkin.checkin_id}
                          {checkin.key_tag_number && (
                            <span className="block text-[10px] text-muted-foreground font-sans">Tag: {checkin.key_tag_number}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div className="font-medium text-foreground">
                            {checkin.customer?.first_name} {checkin.customer?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{checkin.customer?.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div className="font-medium text-foreground">
                            {checkin.vehicle ? `${checkin.vehicle.year || ''} ${checkin.vehicle.make || ''} ${checkin.vehicle.model || ''}`.trim() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border">
                            {checkin.vehicle?.plate_number || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-mono text-xs">
                          {checkin.mileage_in ? `${Number(checkin.mileage_in).toLocaleString()} km` : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-sm max-w-xs">
                          <p className="line-clamp-2 text-xs text-muted-foreground" title={checkin.customer_complaint || 'No complaint specified'}>
                            {checkin.customer_complaint || 'Standard Service'}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${isInspectionPassed ? 'text-emerald-700' : 'text-amber-700'}`}>
                              <ShieldCheck className="w-3 h-3" />
                              {isInspectionPassed ? 'Inspection Passed' : 'Inspection Pending'}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] ${hasSignature ? 'text-blue-700' : 'text-muted-foreground'}`}>
                              <FileCheck className="w-3 h-3" />
                              {hasSignature ? 'Customer Signed' : 'Signature Optional'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          {hasWorkOrder ? (
                            <button
                              onClick={() => navigate(`/work-orders/${checkin.work_order_id}`)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:underline"
                            >
                              WO #{checkin.work_order_id}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {checkin.checked_in_at ? new Date(checkin.checked_in_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-right">
                          {hasWorkOrder ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/work-orders/${checkin.work_order_id}`)}
                              className="text-xs"
                            >
                              View WO
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleCreateWorkOrder(checkin)}
                              disabled={creatingWorkOrder === checkin.checkin_id}
                              style={{ background: 'hsl(84 25% 30%)' }}
                              className="text-xs text-white"
                            >
                              {creatingWorkOrder === checkin.checkin_id ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 mr-1 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Create Work Order
                                </>
                              )}
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

        {/* Workflow Information */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Completed Check-Ins</p>
                  <p className="text-muted-foreground">Vehicles that have completed check-in and inspection are shown above.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium">Quotation Required</p>
                  <p className="text-muted-foreground">A quotation must be created and approved before work can begin.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium">Customer Approval</p>
                  <p className="text-muted-foreground">The customer must approve the quotation before work order creation.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Plus className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Work Order Creation</p>
                  <p className="text-muted-foreground">Once approved, click "Create Work Order" to start the repair process.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}