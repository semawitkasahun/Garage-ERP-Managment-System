import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Clock, CheckCircle, XCircle, AlertCircle, LayoutDashboard, FileText, Calendar, User, Car, MoreHorizontal, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useWorkOrders, useUpdateWorkOrder, useDeleteWorkOrder } from '../hooks/useWorkOrders';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { getNavSections } from '@/layouts/navSections';

const STATUS_BADGES = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Clock },
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open', icon: AlertCircle },
  awaiting_quotation: { color: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Quotation', icon: Clock },
  awaiting_approval: { color: 'bg-orange-100 text-orange-800', label: 'Awaiting Approval', icon: AlertCircle },
  approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
  in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress', icon: Clock },
  completed: { color: 'bg-teal-100 text-teal-800', label: 'Completed', icon: CheckCircle },
  qc_pending: { color: 'bg-amber-100 text-amber-800', label: 'QC Pending', icon: AlertCircle },
  qc_passed: { color: 'bg-emerald-100 text-emerald-800', label: 'QC Passed', icon: CheckCircle },
  qc_failed: { color: 'bg-red-100 text-red-800', label: 'QC Failed', icon: XCircle },
  closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed', icon: CheckCircle },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle },
};

const PRIORITY_BADGES = {
  low: { color: 'bg-green-100 text-green-800', label: 'Low' },
  normal: { color: 'bg-blue-100 text-blue-800', label: 'Normal' },
  high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' },
};

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function WorkOrderListPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [workOrderToEdit, setWorkOrderToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    priority: 'normal',
    status: 'draft',
    supervisor_id: '',
    service_advisor_id: '',
  });

  const { data: workOrders, isLoading, error, refetch } = useWorkOrders();
  const deleteWorkOrder = useDeleteWorkOrder();
  const updateWorkOrder = useUpdateWorkOrder();

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = getNavSections(role);

  const getStatusBadge = (status) => {
    const badge = STATUS_BADGES[status] || STATUS_BADGES.draft;
    const Icon = badge.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const badge = PRIORITY_BADGES[priority] || PRIORITY_BADGES.normal;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredWorkOrders = Array.isArray(workOrders) ? workOrders.filter(wo => {
    const matchesFilter = filter === 'all' || wo.status === filter;
    const matchesSearch = searchTerm === '' || 
      wo.work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.customer?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.customer?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.vehicle?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || wo.priority === priorityFilter;
    
    return matchesFilter && matchesSearch && matchesPriority;
  }) : [];

  const getStatusCounts = () => {
    if (!Array.isArray(workOrders)) return {};
    return workOrders.reduce((acc, wo) => {
      acc[wo.status] = (acc[wo.status] || 0) + 1;
      return acc;
    }, {});
  };

  const statusCounts = getStatusCounts();

  const handleDeleteClick = (workOrder) => {
    setWorkOrderToDelete(workOrder);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!workOrderToDelete) return;
    
    try {
      await deleteWorkOrder.mutateAsync(workOrderToDelete.work_order_id);
      setDeleteDialogOpen(false);
      setWorkOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting work order:', error);
      alert('Failed to delete work order. Please try again.');
    }
  };

  const handleEditClick = (workOrder) => {
    setWorkOrderToEdit(workOrder);
    setEditFormData({
      priority: workOrder.priority || 'normal',
      status: workOrder.status || 'draft',
      supervisor_id: workOrder.supervisor_id || '',
      service_advisor_id: workOrder.service_advisor_id || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!workOrderToEdit) return;
    
    try {
      await updateWorkOrder.mutateAsync({ 
        id: workOrderToEdit.work_order_id, 
        data: editFormData 
      });
      setEditDialogOpen(false);
      setWorkOrderToEdit(null);
    } catch (error) {
      console.error('Error updating work order:', error);
      alert('Failed to update work order. Please try again.');
    }
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Work Orders" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Work Orders</p>
                <p className="text-2xl font-bold">{Array.isArray(workOrders) ? workOrders.length : 0}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{statusCounts['draft'] || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{statusCounts['in_progress'] || 0}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{statusCounts['completed'] || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by WO#, customer, vehicle, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="awaiting_quotation">Awaiting Quotation</option>
              <option value="awaiting_approval">Awaiting Approval</option>
              <option value="approved">Approved</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="qc_pending">QC Pending</option>
              <option value="qc_passed">QC Passed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/work-orders/from-checkin')}
            >
              <FileText className="w-4 h-4 mr-2" />
              From Check-In
            </Button>
            <Button
              onClick={() => navigate('/work-orders/new')}
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Manual Work Order
            </Button>
          </div>
        </div>

        {/* Work Orders Table */}
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 text-left">WO #</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Vehicle</th>
                  <th className="px-4 py-3 text-left">Plate</th>
                  <th className="px-4 py-3 text-left">Job Cards / Services</th>
                  <th className="px-4 py-3 text-left">Technician(s)</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Quotation</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                        <p className="text-sm">Loading work orders...</p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-red-600">
                      Error loading work orders: {error.message}
                    </td>
                  </tr>
                ) : filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center text-muted-foreground">
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                      <p className="font-medium text-foreground">No work orders found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Create a work order from a completed check-in or start a manual work order.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWorkOrders.map((wo) => {
                    const jobCardsList = wo.job_cards || [];
                    const jobCardsCount = wo.job_cards_count ?? jobCardsList.length;
                    
                    // Collect all unique technicians from job cards
                    const technicianNames = [];
                    jobCardsList.forEach(jc => {
                      if (jc.assigned_technician) {
                        const name = jc.assigned_technician.username || `${jc.assigned_technician.first_name || ''} ${jc.assigned_technician.last_name || ''}`.trim();
                        if (name && !technicianNames.includes(name)) {
                          technicianNames.push(name);
                        }
                      }
                    });

                    const totalCost = wo.estimated_total_cost ?? (
                      jobCardsList.reduce((sum, jc) => sum + (parseFloat(jc.estimated_total_cost) || 0), 0)
                    );

                    return (
                      <tr key={wo.work_order_id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3.5 text-sm font-semibold">
                          <button
                            onClick={() => navigate(`/work-orders/${wo.work_order_id}`)}
                            className="text-left font-mono font-bold text-primary hover:underline"
                          >
                            {wo.work_order_number}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div className="font-medium text-foreground">
                            {wo.customer?.first_name} {wo.customer?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">{wo.customer?.phone || ''}</div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <div className="font-medium text-foreground">
                            {wo.vehicle ? `${wo.vehicle.year || ''} ${wo.vehicle.make || ''} ${wo.vehicle.model || ''}`.trim() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs border border-border">
                            {wo.vehicle?.plate_number || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          {jobCardsCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              {jobCardsCount} {jobCardsCount === 1 ? 'Job Card' : 'Job Cards'}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                              0 Job Cards
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          {technicianNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {technicianNames.map((name, idx) => (
                                <span key={idx} className="inline-flex items-center text-xs bg-muted px-2 py-0.5 rounded text-foreground font-medium">
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm">{getPriorityBadge(wo.priority)}</td>
                        <td className="px-4 py-3.5 text-sm">{getStatusBadge(wo.status)}</td>
                        <td className="px-4 py-3.5 text-sm">
                          {wo.quotation ? (
                            <span className="inline-flex flex-col">
                              <span className="text-xs font-mono font-medium text-foreground">{wo.quotation.quotation_number}</span>
                              <span className={`text-[10px] font-semibold uppercase ${
                                wo.quotation.customer_approval_status === 'approved' ? 'text-green-700' :
                                wo.quotation.customer_approval_status === 'rejected' ? 'text-red-700' : 'text-amber-700'
                              }`}>
                                {wo.quotation.customer_approval_status || 'Draft'}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">No Quotation</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-foreground">
                          ETB {Number(totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {wo.created_at ? new Date(wo.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="View Work Order"
                              onClick={() => navigate(`/work-orders/${wo.work_order_id}`)}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Add Job Card"
                              onClick={() => navigate(`/work-orders/${wo.work_order_id}/job-cards/new`)}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Edit Status / Priority"
                              onClick={() => handleEditClick(wo)}
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Delete"
                              onClick={() => handleDeleteClick(wo)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Work Order"
          message={`Are you sure you want to delete work order ${workOrderToDelete?.work_order_number}? This action cannot be undone and will also delete all associated job cards and activities.`}
          confirmText="Delete"
          cancelText="Cancel"
          confirmStyle="danger"
          loading={deleteWorkOrder.isPending}
        />

        {/* Edit Work Order Modal */}
        {editDialogOpen && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget && !updateWorkOrder.isPending) setEditDialogOpen(false); }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card, #fff)',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.05)',
                maxWidth: '500px',
                width: '90%',
              }}
            >
              <div className="flex items-start justify-between p-5 pb-0">
                <div>
                  <h3 className="font-display text-lg font-semibold">Edit Work Order {workOrderToEdit?.work_order_number}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Update the work order details below.</p>
                </div>
                <button
                  onClick={() => setEditDialogOpen(false)}
                  disabled={updateWorkOrder.isPending}
                  className="p-1 rounded-md hover:bg-accent/50 transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-5">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="draft">Draft</option>
                      <option value="open">Open</option>
                      <option value="awaiting_quotation">Awaiting Quotation</option>
                      <option value="awaiting_approval">Awaiting Approval</option>
                      <option value="approved">Approved</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={updateWorkOrder.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateWorkOrder.isPending}
                    style={{ background: 'hsl(84 25% 30%)' }}
                  >
                    {updateWorkOrder.isPending ? 'Updating...' : 'Update Work Order'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}