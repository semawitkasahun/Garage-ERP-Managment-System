import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, User, FileText, AlertCircle, Plus, LayoutDashboard, Car, Calendar, DollarSign, Wrench, Shield, Eye, Edit, Printer, Trash2, Save, Sparkles, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useWorkOrder, useWorkOrderActivities, useStartWorkOrder, useCompleteWorkOrder, useCloseWorkOrder, useUpdateWorkOrder } from '../hooks/useWorkOrders';
import { useUpdateJobCard, useDeleteJobCard, useCreateJobCard } from '@/features/jobcards/hooks/useJobCards';
import { useTechnicians } from '@/features/appointments/hooks/useAppointments';
import { useAuthStore } from '@/features/auth/store/authStore';
import apiClient from '@/services/http/axios';
import { useQuery } from '@tanstack/react-query';
import { getNavSections } from '@/layouts/navSections';

const STATUS_BADGES = {
  draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Clock },
  open: { color: 'bg-blue-100 text-blue-800', label: 'Open', icon: AlertCircle },
  awaiting_quotation: { color: 'bg-yellow-100 text-yellow-800', label: 'Awaiting Quotation', icon: Clock },
  awaiting_approval: { color: 'bg-orange-100 text-orange-800', label: 'Awaiting Approval', icon: AlertCircle },
  approved: { color: 'bg-green-100 text-green-800', label: 'Approved', icon: CheckCircle },
  in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress', icon: Play },
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

export function WorkOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = getNavSections(role);

  const { data: workOrder, isLoading, error, refetch } = useWorkOrder(id);
  const { data: activities } = useWorkOrderActivities(id);
  const { data: technicians } = useTechnicians(workOrder?.branch_id || user?.branch_id);
  
  const startWorkOrder = useStartWorkOrder();
  const completeWorkOrder = useCompleteWorkOrder();
  const closeWorkOrder = useCloseWorkOrder();
  
  const updateWorkOrderMutation = useUpdateWorkOrder();
  const createJobCardMutation = useCreateJobCard();
  const updateJobCardMutation = useUpdateJobCard();
  const deleteJobCardMutation = useDeleteJobCard();

  const [isGeneratingQuotation, setIsGeneratingQuotation] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [isAddJobCardOpen, setIsAddJobCardOpen] = useState(false);
  const [savingCostId, setSavingCostId] = useState(null);

  const [woStatus, setWoStatus] = useState('');
  const [woPriority, setWoPriority] = useState('');
  const [isSavingWorkOrder, setIsSavingWorkOrder] = useState(false);

  useEffect(() => {
    if (workOrder) {
      setWoStatus(workOrder.status || 'draft');
      setWoPriority(workOrder.priority || 'normal');
    }
  }, [workOrder]);

  const handleSaveWorkOrder = async () => {
    setIsSavingWorkOrder(true);
    try {
      await updateWorkOrderMutation.mutateAsync({
        id: Number(id),
        data: {
          status: woStatus,
          priority: woPriority,
        }
      });
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update work order');
    } finally {
      setIsSavingWorkOrder(false);
    }
  };

  const handleApproveJobCard = async (jobCardId) => {
    try {
      await updateJobCardMutation.mutateAsync({
        id: jobCardId,
        data: { status: 'approved' }
      });
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to approve job card');
    }
  };

  // Form state for Add Job Card Modal
  const [addJobCardForm, setAddJobCardForm] = useState({
    step_number: '1',
    job_title: '',
    description: '',
    customer_complaint_related: '',
    priority: 'normal',
    assigned_technician_id: '',
    estimated_labor_hours: '1',
    labor_cost: '0',
    parts_cost: '0',
    other_cost: '0',
  });

  // Form state for Edit Job Card Modal
  const [editJobCardForm, setEditJobCardForm] = useState({
    step_number: '1',
    job_title: '',
    description: '',
    customer_complaint_related: '',
    priority: 'normal',
    assigned_technician_id: '',
    estimated_labor_hours: '1',
    labor_cost: '0',
    parts_cost: '0',
    other_cost: '0',
  });

  // Inline money inputs per job card
  const [inlineCosts, setInlineCosts] = useState({});

  const handleInlineCostChange = (jobCardId, field, value) => {
    setInlineCosts(prev => ({
      ...prev,
      [jobCardId]: {
        ...(prev[jobCardId] || {}),
        [field]: value,
      }
    }));
  };

  const handleSaveInlineCosts = async (jobCard) => {
    setSavingCostId(jobCard.job_card_id);
    const jcCosts = inlineCosts[jobCard.job_card_id] || {};
    
    const labor_cost = jcCosts.labor_cost !== undefined ? parseFloat(jcCosts.labor_cost) || 0 : (parseFloat(jobCard.labor_cost) || 0);
    const parts_cost = jcCosts.parts_cost !== undefined ? parseFloat(jcCosts.parts_cost) || 0 : (parseFloat(jobCard.parts_cost) || 0);
    const other_cost = jcCosts.other_cost !== undefined ? parseFloat(jcCosts.other_cost) || 0 : (parseFloat(jobCard.other_cost) || 0);
    const estimated_labor_hours = jcCosts.estimated_labor_hours !== undefined ? parseFloat(jcCosts.estimated_labor_hours) || 0 : (parseFloat(jobCard.estimated_labor_hours) || 0);
    const assigned_technician_id = jcCosts.assigned_technician_id !== undefined
      ? (jcCosts.assigned_technician_id ? Number(jcCosts.assigned_technician_id) : null)
      : (jobCard.assigned_technician_id || null);

    try {
      await updateJobCardMutation.mutateAsync({
        id: jobCard.job_card_id,
        data: {
          labor_cost,
          parts_cost,
          other_cost,
          estimated_labor_hours,
          assigned_technician_id,
        }
      });
    } finally {
      setSavingCostId(null);
    }
  };

  const [isSplittingJobCards, setIsSplittingJobCards] = useState(false);

  const handleSplitJobCards = async () => {
    setIsSplittingJobCards(true);
    try {
      const res = await apiClient.post(`/work-orders/${id}/split-job-cards`, {});
      alert(res.data?.message || 'Split merged service titles into individual Job Cards.');
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to split job cards');
    } finally {
      setIsSplittingJobCards(false);
    }
  };

  // Inventory items for part picker dropdown
  const { data: inventoryItemsData } = useQuery({
    queryKey: ['inventory-items-select'],
    queryFn: async () => {
      const res = await apiClient.get('/inventory-items', { params: { per_page: 100 } });
      const items = res.data?.data || res.data || [];
      return Array.isArray(items) ? items : [];
    },
  });
  const inventoryItemsList = Array.isArray(inventoryItemsData) ? inventoryItemsData : [];

  // Itemized Part Form state per Job Card
  const [partForms, setPartForms] = useState({});
  const [addingPartJobCardId, setAddingPartJobCardId] = useState(null);

  const handlePartFormChange = (jobCardId, field, value) => {
    setPartForms(prev => ({
      ...prev,
      [jobCardId]: {
        ...(prev[jobCardId] || { part_name: '', inventory_item_id: '', requested_quantity: '1', unit_cost: '0', notes: '' }),
        [field]: value,
      }
    }));
  };

  const handleSelectInventoryItem = (jobCardId, itemId) => {
    if (!itemId) return;
    const invItem = inventoryItemsList.find(i => String(i.item_id) === String(itemId));
    if (invItem) {
      setPartForms(prev => ({
        ...prev,
        [jobCardId]: {
          ...(prev[jobCardId] || {}),
          inventory_item_id: itemId,
          part_name: invItem.name || '',
          unit_cost: invItem.unit_price || invItem.unit_cost || '0',
          requested_quantity: prev[jobCardId]?.requested_quantity || '1',
        }
      }));
    }
  };

  const handleAddPartSubmit = async (jobCard) => {
    const jobCardId = jobCard.job_card_id;
    const form = partForms[jobCardId] || {};
    if (!form.part_name && !form.inventory_item_id) {
      alert('Please enter a Part Name or select an item from Inventory.');
      return;
    }

    setAddingPartJobCardId(jobCardId);
    try {
      await apiClient.post(`/job-cards/${jobCardId}/parts`, {
        part_name: form.part_name || '',
        inventory_item_id: form.inventory_item_id ? Number(form.inventory_item_id) : null,
        requested_quantity: parseFloat(form.requested_quantity) || 1,
        unit_cost: parseFloat(form.unit_cost) || 0,
        notes: form.notes || '',
      });
      
      setPartForms(prev => ({
        ...prev,
        [jobCardId]: { part_name: '', inventory_item_id: '', requested_quantity: '1', unit_cost: '0', notes: '' }
      }));
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add part to job card');
    } finally {
      setAddingPartJobCardId(null);
    }
  };

  const handleDeletePart = async (jobCardId, partId) => {
    if (!confirm('Are you sure you want to remove this part from the job card?')) return;
    try {
      await apiClient.delete(`/job-cards/${jobCardId}/parts/${partId}`);
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to remove part');
    }
  };

  const handleDeleteJobCard = async (jobCardId) => {
    if (!window.confirm('Are you sure you want to delete this job card?')) return;
    try {
      await deleteJobCardMutation.mutateAsync(jobCardId);
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete job card');
    }
  };

  const handleCreateJobCardSubmit = async (e) => {
    e.preventDefault();
    try {
      await createJobCardMutation.mutateAsync({
        work_order_id: Number(id),
        step_number: parseInt(addJobCardForm.step_number) || 1,
        job_title: addJobCardForm.job_title,
        description: addJobCardForm.description,
        customer_complaint_related: addJobCardForm.customer_complaint_related,
        priority: addJobCardForm.priority,
        assigned_technician_id: addJobCardForm.assigned_technician_id ? Number(addJobCardForm.assigned_technician_id) : null,
        estimated_labor_hours: parseFloat(addJobCardForm.estimated_labor_hours) || 0,
        labor_cost: parseFloat(addJobCardForm.labor_cost) || 0,
        parts_cost: parseFloat(addJobCardForm.parts_cost) || 0,
        other_cost: parseFloat(addJobCardForm.other_cost) || 0,
      });
      setIsAddJobCardOpen(false);
      setAddJobCardForm({
        step_number: String((workOrder?.job_cards?.length || 0) + 2),
        job_title: '',
        description: '',
        customer_complaint_related: '',
        priority: 'normal',
        assigned_technician_id: '',
        estimated_labor_hours: '1',
        labor_cost: '0',
        parts_cost: '0',
        other_cost: '0',
      });
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create job card');
    }
  };

  const openEditModal = (jobCard) => {
    setEditingJobCard(jobCard);
    setEditJobCardForm({
      step_number: String(jobCard.step_number || 1),
      job_title: jobCard.job_title || '',
      description: jobCard.description || '',
      customer_complaint_related: jobCard.customer_complaint_related || '',
      priority: jobCard.priority || 'normal',
      assigned_technician_id: jobCard.assigned_technician_id || '',
      estimated_labor_hours: jobCard.estimated_labor_hours || '1',
      labor_cost: jobCard.labor_cost || '0',
      parts_cost: jobCard.parts_cost || '0',
      other_cost: jobCard.other_cost || '0',
    });
  };

  const handleEditJobCardSubmit = async (e) => {
    e.preventDefault();
    if (!editingJobCard) return;
    try {
      await updateJobCardMutation.mutateAsync({
        id: editingJobCard.job_card_id,
        data: {
          step_number: parseInt(editJobCardForm.step_number) || 1,
          job_title: editJobCardForm.job_title,
          description: editJobCardForm.description,
          customer_complaint_related: editJobCardForm.customer_complaint_related,
          priority: editJobCardForm.priority,
          assigned_technician_id: editJobCardForm.assigned_technician_id ? Number(editJobCardForm.assigned_technician_id) : null,
          estimated_labor_hours: parseFloat(editJobCardForm.estimated_labor_hours) || 0,
          labor_cost: parseFloat(editJobCardForm.labor_cost) || 0,
          parts_cost: parseFloat(editJobCardForm.parts_cost) || 0,
          other_cost: parseFloat(editJobCardForm.other_cost) || 0,
        }
      });
      setEditingJobCard(null);
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update job card');
    }
  };

  const handleGenerateQuotation = async () => {
    setIsGeneratingQuotation(true);
    try {
      await apiClient.post('/quotations/generate-from-job-cards', { work_order_id: Number(id) });
      await refetch();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to generate quotation');
    } finally {
      setIsGeneratingQuotation(false);
    }
  };

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

  const getTimelineSteps = () => {
    // Mock timeline steps - in real implementation, this would come from the API
    return [
      { step: 'checkin', label: 'Check-In', completed: !!workOrder?.checkin, date: workOrder?.checkin?.checked_in_at },
      { step: 'inspection', label: 'Inspection', completed: workOrder?.checkin?.inspection_status === 'completed', date: workOrder?.checkin?.inspection_completed_at },
      { step: 'quotation', label: 'Quotation', completed: workOrder?.quotation?.customer_approval_status === 'approved', date: workOrder?.quotation?.customer_approved_at },
      { step: 'work', label: 'Work', completed: workOrder?.status === 'completed' || workOrder?.status === 'qc_passed', date: workOrder?.completed_at },
      { step: 'qc', label: 'Quality Control', completed: workOrder?.qc_status === 'passed', date: workOrder?.qc_performed_at },
      { step: 'invoice', label: 'Invoice', completed: workOrder?.status === 'invoiced' || workOrder?.status === 'closed', date: workOrder?.invoice?.created_at },
      { step: 'payment', label: 'Payment', completed: workOrder?.status === 'closed', date: workOrder?.invoice?.paid_at },
    ];
  };

  const getPrimaryAction = () => {
    switch (workOrder?.status) {
      case 'draft':
        return (
          <Button onClick={() => navigate(`/quotations/new?work_order_id=${id}`)} style={{ background: 'hsl(84 25% 30%)' }}>
            <FileText className="w-4 h-4 mr-2" />
            Generate Quotation
          </Button>
        );
      case 'awaiting_approval':
        return (
          <Button onClick={() => navigate(`/quotations/new?work_order_id=${id}`)} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            View Quotation
          </Button>
        );
      case 'approved':
        return (
          <Button onClick={() => setShowStartConfirm(true)} style={{ background: 'hsl(84 25% 30%)' }}>
            <Play className="w-4 h-4 mr-2" />
            Start Work
          </Button>
        );
      case 'in_progress':
        return (
          <Button onClick={() => setShowCompleteConfirm(true)} style={{ background: 'hsl(84 25% 30%)' }}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Work
          </Button>
        );
      case 'completed':
        return (
          <Button onClick={() => navigate(`/work-orders/${id}/qc`)} style={{ background: 'hsl(84 25% 30%)' }}>
            <Shield className="w-4 h-4 mr-2" />
            Send to QC
          </Button>
        );
      case 'qc_passed':
        return (
          <Button onClick={() => navigate(`/invoices/new?work_order_id=${id}`)} style={{ background: 'hsl(84 25% 30%)' }}>
            <DollarSign className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        );
      default:
        return null;
    }
  };

  const handleStartWork = async () => {
    try {
      await startWorkOrder.mutateAsync(id);
      setShowStartConfirm(false);
    } catch (error) {
      console.error('Failed to start work order:', error);
    }
  };

  const handleCompleteWork = async () => {
    try {
      await completeWorkOrder.mutateAsync(id);
      setShowCompleteConfirm(false);
    } catch (error) {
      console.error('Failed to complete work order:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Work Order Details" roleLabel={user?.username ?? 'Staff'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading work order...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !workOrder) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Work Order Details" roleLabel={user?.username ?? 'Staff'}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-red-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Work Order not found</h3>
          <p className="text-muted-foreground mb-4">The work order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/work-orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Work Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const timelineSteps = getTimelineSteps();

  return (
    <DashboardLayout navSections={navSections} pageTitle={`Work Order ${workOrder.work_order_number}`} roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/work-orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{workOrder.work_order_number}</h1>
              <p className="text-muted-foreground">
                {workOrder.is_manual ? 'Manual Work Order' : `Created from Check-In #${workOrder.checkin_id}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleSaveWorkOrder}
              disabled={isSavingWorkOrder}
              style={{ background: 'hsl(84 25% 30%)' }}
              className="text-white font-semibold"
            >
              {isSavingWorkOrder ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Work Order
            </Button>
            {getPrimaryAction()}
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {timelineSteps.map((step, index) => (
                <div key={step.step} className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {step.completed ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <p className="text-xs mt-2 text-center">{step.label}</p>
                  {step.date && (
                    <p className="text-xs text-muted-foreground text-center">
                      {new Date(step.date).toLocaleDateString()}
                    </p>
                  )}
                  {index < timelineSteps.length - 1 && (
                    <div className={`h-0.5 w-full mt-4 ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editable Work Order Controls Card */}
        <Card className="border-border shadow-sm bg-muted/20">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                Work Order Controls & Settings
              </CardTitle>
              <Button
                size="sm"
                onClick={handleSaveWorkOrder}
                disabled={isSavingWorkOrder}
                style={{ background: 'hsl(84 25% 30%)' }}
                className="text-white text-xs"
              >
                {isSavingWorkOrder ? (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                Save Work Order
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Work Order Status</Label>
                <select
                  value={woStatus}
                  onChange={(e) => setWoStatus(e.target.value)}
                  className="w-full p-2 text-xs border rounded-md bg-background font-medium"
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="awaiting_quotation">Awaiting Quotation</option>
                  <option value="awaiting_approval">Awaiting Customer Approval</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="qc_pending">QC Pending</option>
                  <option value="qc_passed">QC Passed</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Priority Level</Label>
                <select
                  value={woPriority}
                  onChange={(e) => setWoPriority(e.target.value)}
                  className="w-full p-2 text-xs border rounded-md bg-background font-medium"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Job Cards Count</Label>
                <div className="p-2 border rounded-md bg-background text-xs font-bold font-mono text-primary flex items-center justify-between">
                  <span>{workOrder.job_cards?.length || 0} Active Job Cards</span>
                  <span className="text-[11px] font-normal text-muted-foreground">
                    ({workOrder.job_cards?.filter(j => j.status === 'approved').length || 0} Approved)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {workOrder.customer?.first_name} {workOrder.customer?.last_name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span>{workOrder.customer?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{workOrder.customer?.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-medium">
                        {workOrder.vehicle?.year} {workOrder.vehicle?.make} {workOrder.vehicle?.model}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plate Number:</span>
                      <span>{workOrder.vehicle?.plate_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VIN:</span>
                      <span>{workOrder.vehicle?.vin || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mileage In:</span>
                      <span>{workOrder.mileage_in?.toLocaleString() || 'N/A'} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Complaint */}
              {workOrder.checkin?.customer_complaint && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold mb-2">Customer Complaint</h3>
                  <p className="text-sm bg-yellow-50 p-3 rounded-md border border-yellow-200">
                    {workOrder.checkin.customer_complaint}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Cards Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    Job Cards & Services
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fill in labor hours, labor costs, parts costs & other charges per service. Generate Quotation instantly.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSplitJobCards}
                    disabled={isSplittingJobCards || !workOrder.job_cards?.length}
                    title="Split merged service titles (e.g. Oil Change, Brake Service) into individual Job Cards"
                    className="text-amber-800 border-amber-300 hover:bg-amber-50"
                  >
                    {isSplittingJobCards ? (
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1.5 text-amber-600" />
                    )}
                    Split Merged Services
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateQuotation}
                    disabled={isGeneratingQuotation || !workOrder.job_cards?.length}
                    className="text-primary border-primary/30 hover:bg-primary/10"
                  >
                    {isGeneratingQuotation ? (
                      <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-1.5 text-primary" />
                    )}
                    Generate Quotation
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsAddJobCardOpen(true)}
                    style={{ background: 'hsl(84 25% 30%)' }}
                    className="text-white"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Add Job Card
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {workOrder.job_cards && workOrder.job_cards.length > 0 ? (
                <div className="space-y-6">
                  {workOrder.job_cards.map((jobCard) => {
                    const currentInline = inlineCosts[jobCard.job_card_id] || {};
                    const laborHoursVal = currentInline.estimated_labor_hours !== undefined ? currentInline.estimated_labor_hours : (jobCard.estimated_labor_hours ?? '1');
                    const laborCostVal = currentInline.labor_cost !== undefined ? currentInline.labor_cost : (jobCard.labor_cost ?? '0');
                    const partsCostVal = currentInline.parts_cost !== undefined ? currentInline.parts_cost : (jobCard.parts_cost ?? '0');
                    const otherCostVal = currentInline.other_cost !== undefined ? currentInline.other_cost : (jobCard.other_cost ?? '0');

                    const calcLabor = parseFloat(laborCostVal) || 0;
                    const calcParts = parseFloat(partsCostVal) || 0;
                    const calcOther = parseFloat(otherCostVal) || 0;
                    const calcTotal = calcLabor + calcParts + calcOther;

                    return (
                      <div key={jobCard.job_card_id} className="border border-border rounded-xl p-5 bg-card hover:border-primary/40 transition-all shadow-sm space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                                Step {jobCard.step_number || index + 1}
                              </span>
                              <span className="font-mono text-sm font-bold bg-muted px-2.5 py-0.5 rounded border border-border">
                                {jobCard.job_card_number}
                              </span>
                              <h4 className="text-base font-semibold text-foreground">{jobCard.job_title}</h4>
                              {jobCard.service_category && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-200">
                                  {jobCard.service_category}
                                </span>
                              )}
                              {getStatusBadge(jobCard.status)}
                              {getPriorityBadge(jobCard.priority)}
                            </div>

                            {jobCard.description && (
                              <p className="text-sm text-muted-foreground">{jobCard.description}</p>
                            )}

                            {jobCard.customer_complaint_related && (
                              <p className="text-xs bg-amber-50/70 border border-amber-200/60 text-amber-900 px-2.5 py-1 rounded inline-block">
                                <span className="font-medium">Related Complaint:</span> {jobCard.customer_complaint_related}
                              </p>
                            )}

                            {/* Technician assignment badge */}
                            <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span>Technician: </span>
                              {jobCard.assigned_technician ? (
                                <span className="font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded">
                                  {jobCard.assigned_technician.username || `${jobCard.assigned_technician.first_name || ''} ${jobCard.assigned_technician.last_name || ''}`.trim()}
                                </span>
                              ) : (
                                <span className="text-amber-700 italic">Unassigned</span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons per Job Card */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-2 lg:pt-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(jobCard)}
                              title="Edit Job Card Details"
                              className="text-xs"
                            >
                              <Edit className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteJobCard(jobCard.job_card_id)}
                              title="Delete Job Card"
                              className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </Button>

                            {jobCard.status !== 'approved' && jobCard.status !== 'in_progress' && jobCard.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveJobCard(jobCard.job_card_id)}
                                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs font-semibold"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                Approve
                              </Button>
                            )}
                            {jobCard.status === 'approved' && (
                              <Button
                                size="sm"
                                style={{ background: 'hsl(84 25% 30%)' }}
                                className="text-white text-xs font-semibold"
                                onClick={async () => {
                                  try {
                                    await apiClient.post(`/job-cards/${jobCard.job_card_id}/start`);
                                    await refetch();
                                  } catch (e) {
                                    alert(e.message);
                                  }
                                }}
                              >
                                <Play className="w-3.5 h-3.5 mr-1" />
                                Start Job
                              </Button>
                            )}
                            {jobCard.status === 'in_progress' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-teal-700 border-teal-300 hover:bg-teal-50"
                                onClick={async () => {
                                  const notes = prompt('Enter technician completion notes:');
                                  if (notes !== null) {
                                    try {
                                      await apiClient.post(`/job-cards/${jobCard.job_card_id}/complete`, { technician_notes: notes });
                                      await refetch();
                                    } catch (e) {
                                      alert(e.message);
                                    }
                                  }
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Complete Job
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Fillable Money / Cost Breakdown Panel */}
                        <div className="mt-3 p-3.5 bg-muted/40 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-primary" />
                              Fillable Pricing & Money Breakdown (ETB)
                            </span>
                            <span className="text-xs font-mono font-bold text-primary">
                              Job Total: ETB {calcTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
                            <div>
                              <Label className="text-[11px] text-muted-foreground mb-1 block">Assigned Technician</Label>
                              <select
                                value={currentInline.assigned_technician_id !== undefined ? currentInline.assigned_technician_id : (jobCard.assigned_technician_id || '')}
                                onChange={(e) => handleInlineCostChange(jobCard.job_card_id, 'assigned_technician_id', e.target.value)}
                                className="h-8 w-full text-xs px-2 border rounded bg-background"
                              >
                                <option value="">-- Unassigned --</option>
                                {Array.isArray(technicians) && technicians.map((tech) => (
                                  <option key={tech.user_id} value={tech.user_id}>
                                    {tech.name || tech.username}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground mb-1 block">Est. Labor (Hrs)</Label>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={laborHoursVal}
                                onChange={(e) => handleInlineCostChange(jobCard.job_card_id, 'estimated_labor_hours', e.target.value)}
                                className="h-8 text-xs font-mono bg-background"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground mb-1 block">Labor Cost (ETB)</Label>
                              <Input
                                type="number"
                                step="10"
                                min="0"
                                value={laborCostVal}
                                onChange={(e) => handleInlineCostChange(jobCard.job_card_id, 'labor_cost', e.target.value)}
                                className="h-8 text-xs font-mono bg-background font-semibold"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground mb-1 block">Parts Cost (ETB)</Label>
                              <Input
                                type="number"
                                step="10"
                                min="0"
                                value={partsCostVal}
                                onChange={(e) => handleInlineCostChange(jobCard.job_card_id, 'parts_cost', e.target.value)}
                                className="h-8 text-xs font-mono bg-background font-semibold"
                              />
                            </div>
                            <div>
                              <Label className="text-[11px] text-muted-foreground mb-1 block">Other Cost (ETB)</Label>
                              <Input
                                type="number"
                                step="10"
                                min="0"
                                value={otherCostVal}
                                onChange={(e) => handleInlineCostChange(jobCard.job_card_id, 'other_cost', e.target.value)}
                                className="h-8 text-xs font-mono bg-background font-semibold"
                              />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <Button
                                size="sm"
                                onClick={() => handleSaveInlineCosts(jobCard)}
                                disabled={savingCostId === jobCard.job_card_id}
                                style={{ background: 'hsl(84 25% 30%)' }}
                                className="w-full h-8 text-xs text-white"
                              >
                                {savingCostId === jobCard.job_card_id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5 mr-1" />
                                    Save Price
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Itemized Parts Breakdown Section */}
                        <div className="mt-4 p-4 rounded-lg bg-blue-50/40 border border-blue-200/80 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-200/60 pb-2">
                            <div>
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-blue-700" />
                                Itemized Parts & Materials Required for Fix (From Inspection Findings)
                              </span>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                Specify all required parts, replacement components, and cost breakdown that the customer is paying for.
                              </p>
                            </div>
                            <span className="text-xs font-mono font-bold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-300 shrink-0">
                              Subtotal: ETB {Number(jobCard.parts_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Existing Parts Table */}
                          {jobCard.parts && jobCard.parts.length > 0 ? (
                            <div className="overflow-x-auto rounded-md border border-blue-200/60 bg-white">
                              <table className="w-full text-xs">
                                <thead className="bg-blue-100/40 text-blue-950 font-semibold border-b border-blue-200/60">
                                  <tr>
                                    <th className="px-3 py-2 text-left">Part Name / Component</th>
                                    <th className="px-3 py-2 text-left">Inspection Reason / Notes</th>
                                    <th className="px-3 py-2 text-right">Qty</th>
                                    <th className="px-3 py-2 text-right">Unit Cost (ETB)</th>
                                    <th className="px-3 py-2 text-right">Total Cost (ETB)</th>
                                    <th className="px-3 py-2 text-center w-10"></th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100">
                                  {jobCard.parts.map((p) => {
                                    const pName = p.part_name || p.inventory_item?.name || 'Itemized Part';
                                    const pUnit = Number(p.unit_cost || 0);
                                    const pQty = Number(p.requested_quantity || 1);
                                    const pTotal = Number(p.total_cost || pUnit * pQty);

                                    return (
                                      <tr key={p.job_card_part_id || p.id} className="hover:bg-blue-50/50">
                                        <td className="px-3 py-2 font-medium text-foreground">
                                          <div className="flex items-center gap-1.5">
                                            <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                            <span>{pName}</span>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 text-muted-foreground italic">
                                          {p.notes || jobCard.customer_complaint_related || 'Required for service fix'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-semibold">{pQty}</td>
                                        <td className="px-3 py-2 text-right font-mono">ETB {pUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">ETB {pTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-3 py-2 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleDeletePart(jobCard.job_card_id, p.job_card_part_id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                            title="Remove Part"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic bg-white/60 p-2.5 rounded border border-dashed border-blue-200">
                              No specific parts itemized for this service step yet. Fill out the form below to add required parts.
                            </p>
                          )}

                          {/* Inline Form to Add a Part */}
                          <div className="pt-2 border-t border-blue-200/50">
                            <span className="text-[11px] font-semibold text-blue-900 block mb-1.5">+ Add Required Part for this Fix</span>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                              {/* Pick inventory item OR type name */}
                              <div className="sm:col-span-3">
                                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Select Inventory Part</Label>
                                <select
                                  value={partForms[jobCard.job_card_id]?.inventory_item_id || ''}
                                  onChange={(e) => handleSelectInventoryItem(jobCard.job_card_id, e.target.value)}
                                  className="w-full h-8 text-xs px-2 border rounded bg-white"
                                >
                                  <option value="">-- Custom Part Entry --</option>
                                  {inventoryItemsList.map(inv => (
                                    <option key={inv.item_id} value={inv.item_id}>
                                      {inv.name} (ETB {Number(inv.unit_price || inv.unit_cost || 0).toLocaleString()})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-3">
                                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Part Name / Description *</Label>
                                <Input
                                  placeholder="e.g. Brake Pad Front Set"
                                  value={partForms[jobCard.job_card_id]?.part_name || ''}
                                  onChange={(e) => handlePartFormChange(jobCard.job_card_id, 'part_name', e.target.value)}
                                  className="h-8 text-xs bg-white"
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Qty</Label>
                                <Input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={partForms[jobCard.job_card_id]?.requested_quantity || '1'}
                                  onChange={(e) => handlePartFormChange(jobCard.job_card_id, 'requested_quantity', e.target.value)}
                                  className="h-8 text-xs font-mono bg-white"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Unit Cost (ETB)</Label>
                                <Input
                                  type="number"
                                  step="10"
                                  min="0"
                                  placeholder="0.00"
                                  value={partForms[jobCard.job_card_id]?.unit_cost || '0'}
                                  onChange={(e) => handlePartFormChange(jobCard.job_card_id, 'unit_cost', e.target.value)}
                                  className="h-8 text-xs font-mono bg-white font-semibold"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <Label className="text-[10px] text-muted-foreground mb-0.5 block">Inspection Reason</Label>
                                <Input
                                  placeholder="e.g. Worn below limit"
                                  value={partForms[jobCard.job_card_id]?.notes || ''}
                                  onChange={(e) => handlePartFormChange(jobCard.job_card_id, 'notes', e.target.value)}
                                  className="h-8 text-xs bg-white"
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={() => handleAddPartSubmit(jobCard)}
                                  disabled={addingPartJobCardId === jobCard.job_card_id}
                                  style={{ background: 'hsl(84 25% 30%)' }}
                                  className="w-full h-8 text-xs text-white p-0 flex items-center justify-center"
                                  title="Add Part"
                                >
                                  {addingPartJobCardId === jobCard.job_card_id ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Plus className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Financial Aggregation Summary Box */}
                  <div className="bg-muted/40 border rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Work Order Financial Summary</h4>
                      <p className="text-xs text-muted-foreground">Aggregated automatically from all {workOrder.job_cards.length} Job Cards.</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Labor Subtotal</span>
                        <span className="font-semibold font-mono">ETB {Number(workOrder.labor_total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Parts Subtotal</span>
                        <span className="font-semibold font-mono">ETB {Number(workOrder.parts_total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="text-right border-l pl-4">
                        <span className="text-xs text-primary font-bold block">Grand Total</span>
                        <span className="text-base font-bold font-mono text-foreground">
                          ETB {Number(workOrder.estimated_total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                  <Wrench className="h-12 w-12 text-muted-foreground/60 mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1 text-foreground">No Job Cards Added Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Every Work Order must contain one or more Job Cards representing the specific services required on the vehicle.
                  </p>
                  <Button
                    onClick={() => setIsAddJobCardOpen(true)}
                    style={{ background: 'hsl(84 25% 30%)' }}
                    className="text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Job Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotation & Customer Approval Section */}
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Quotation & Customer Approval
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official quotation generated automatically from Job Cards for customer review and signature.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleGenerateQuotation}
                  disabled={isGeneratingQuotation || !workOrder.job_cards?.length}
                  style={{ background: 'hsl(84 25% 30%)' }}
                  className="text-white"
                >
                  {isGeneratingQuotation ? (
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-1.5" />
                  )}
                  {workOrder.quotation ? 'Re-Generate Quotation' : 'Generate Quotation'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {workOrder.quotation ? (
                <div className="p-4 border rounded-xl bg-card space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <span className="font-mono text-sm font-bold text-primary">{workOrder.quotation.quotation_number}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {new Date(workOrder.quotation.created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        workOrder.quotation.customer_approval_status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        workOrder.quotation.customer_approval_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Approval: {workOrder.quotation.customer_approval_status || 'Draft'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm border-t pt-3">
                    <div>
                      <span className="text-xs text-muted-foreground block">Subtotal</span>
                      <span className="font-mono font-medium">ETB {Number(workOrder.quotation.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Tax (15% VAT)</span>
                      <span className="font-mono font-medium">ETB {Number(workOrder.quotation.tax_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block">Discount</span>
                      <span className="font-mono font-medium">ETB {Number(workOrder.quotation.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-xs text-primary font-semibold block">Total Quotation</span>
                      <span className="font-mono font-bold text-foreground">ETB {Number(workOrder.quotation.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Line items preview if available */}
                  {workOrder.quotation.items && workOrder.quotation.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-xs font-semibold text-foreground block mb-2">Quotation Line Items:</span>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {workOrder.quotation.items.map((item) => (
                          <div key={item.item_id || Math.random()} className="flex justify-between items-center text-xs bg-muted/40 px-2.5 py-1.5 rounded">
                            <span>{item.description} ({item.item_type})</span>
                            <span className="font-mono font-medium">ETB {Number(item.line_total || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic py-2">
                  No quotation has been generated for this Work Order yet. Fill in Job Card costs above and click "Generate Quotation".
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Section */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              {activities && activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.activity_id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{activity.action.replace(/_/g, ' ').toUpperCase()}</p>
                            <span className="text-sm text-muted-foreground">
                              {new Date(activity.performed_at).toLocaleString()}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            By: {activity.performed_by?.username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Activity</h3>
                  <p className="text-muted-foreground">No activity has been recorded for this work order yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Start Work Confirmation Dialog */}
        {showStartConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Start Work Order?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to start work on {workOrder.work_order_number}?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer:</span>
                    <span className="font-medium">
                      {workOrder.customer?.first_name} {workOrder.customer?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vehicle:</span>
                    <span className="font-medium">
                      {workOrder.vehicle?.year} {workOrder.vehicle?.make} {workOrder.vehicle?.model}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Job Cards:</span>
                    <span className="font-medium">{workOrder.job_cards?.length || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowStartConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartWork}
                    disabled={startWorkOrder.isPending}
                    style={{ background: 'hsl(84 25% 30%)' }}
                  >
                    {startWorkOrder.isPending ? 'Starting...' : 'Start Work'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Job Card Modal */}
        {isAddJobCardOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg bg-card border-border shadow-xl">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Add New Job Card
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleCreateJobCardSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="add_step_number">Step # *</Label>
                      <Input
                        id="add_step_number"
                        type="number"
                        min="1"
                        required
                        value={addJobCardForm.step_number}
                        onChange={(e) => setAddJobCardForm({ ...addJobCardForm, step_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="add_job_title">Service / Job Title *</Label>
                      <Input
                        id="add_job_title"
                        required
                        placeholder="e.g. Engine Oil & Filter Change"
                        value={addJobCardForm.job_title}
                        onChange={(e) => setAddJobCardForm({ ...addJobCardForm, job_title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="add_description">Service Description</Label>
                    <textarea
                      id="add_description"
                      rows={2}
                      className="w-full p-2 text-xs border rounded-md bg-background"
                      placeholder="Detailed work instructions or requirements..."
                      value={addJobCardForm.description}
                      onChange={(e) => setAddJobCardForm({ ...addJobCardForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="add_assigned_tech">Assigned Technician</Label>
                      <select
                        id="add_assigned_tech"
                        value={addJobCardForm.assigned_technician_id}
                        onChange={(e) => setAddJobCardForm({ ...addJobCardForm, assigned_technician_id: e.target.value })}
                        className="w-full p-2 text-xs border rounded-md bg-background"
                      >
                        <option value="">Select Technician</option>
                        {technicians && technicians.map(t => (
                          <option key={t.user_id} value={t.user_id}>
                            {t.username || `${t.first_name || ''} ${t.last_name || ''}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="add_priority">Priority</Label>
                      <select
                        id="add_priority"
                        value={addJobCardForm.priority}
                        onChange={(e) => setAddJobCardForm({ ...addJobCardForm, priority: e.target.value })}
                        className="w-full p-2 text-xs border rounded-md bg-background"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Money Fillable Fields */}
                  <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
                    <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                      Initial Pricing & Costs (ETB)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Est. Labor Hours</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={addJobCardForm.estimated_labor_hours}
                          onChange={(e) => setAddJobCardForm({ ...addJobCardForm, estimated_labor_hours: e.target.value })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Labor Cost (ETB)</Label>
                        <Input
                          type="number"
                          step="10"
                          min="0"
                          value={addJobCardForm.labor_cost}
                          onChange={(e) => setAddJobCardForm({ ...addJobCardForm, labor_cost: e.target.value })}
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Parts Cost (ETB)</Label>
                        <Input
                          type="number"
                          step="10"
                          min="0"
                          value={addJobCardForm.parts_cost}
                          onChange={(e) => setAddJobCardForm({ ...addJobCardForm, parts_cost: e.target.value })}
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Other Cost (ETB)</Label>
                        <Input
                          type="number"
                          step="10"
                          min="0"
                          value={addJobCardForm.other_cost}
                          onChange={(e) => setAddJobCardForm({ ...addJobCardForm, other_cost: e.target.value })}
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddJobCardOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createJobCardMutation.isPending}
                      style={{ background: 'hsl(84 25% 30%)' }}
                      className="text-white"
                    >
                      {createJobCardMutation.isPending ? 'Saving...' : 'Add Job Card'}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}

        {/* Edit Job Card Modal */}
        {editingJobCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg bg-card border-border shadow-xl">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Edit Job Card #{editingJobCard.job_card_number}
                </CardTitle>
              </CardHeader>
              <form onSubmit={handleEditJobCardSubmit}>
                <CardContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-1">
                      <Label htmlFor="edit_step_number">Step # *</Label>
                      <Input
                        id="edit_step_number"
                        type="number"
                        min="1"
                        required
                        value={editJobCardForm.step_number}
                        onChange={(e) => setEditJobCardForm({ ...editJobCardForm, step_number: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="edit_job_title">Service / Job Title *</Label>
                      <Input
                        id="edit_job_title"
                        required
                        value={editJobCardForm.job_title}
                        onChange={(e) => setEditJobCardForm({ ...editJobCardForm, job_title: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit_description">Service Description</Label>
                    <textarea
                      id="edit_description"
                      rows={2}
                      className="w-full p-2 text-xs border rounded-md bg-background"
                      value={editJobCardForm.description}
                      onChange={(e) => setEditJobCardForm({ ...editJobCardForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_assigned_tech">Assigned Technician</Label>
                      <select
                        id="edit_assigned_tech"
                        value={editJobCardForm.assigned_technician_id}
                        onChange={(e) => setEditJobCardForm({ ...editJobCardForm, assigned_technician_id: e.target.value })}
                        className="w-full p-2 text-xs border rounded-md bg-background"
                      >
                        <option value="">Select Technician</option>
                        {technicians && technicians.map(t => (
                          <option key={t.user_id} value={t.user_id}>
                            {t.username || `${t.first_name || ''} ${t.last_name || ''}`.trim()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit_priority">Priority</Label>
                      <select
                        id="edit_priority"
                        value={editJobCardForm.priority}
                        onChange={(e) => setEditJobCardForm({ ...editJobCardForm, priority: e.target.value })}
                        className="w-full p-2 text-xs border rounded-md bg-background"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Money Fillable Fields */}
                  <div className="p-3 bg-muted/30 rounded-lg border space-y-3">
                    <span className="text-xs font-bold text-foreground block uppercase tracking-wider">
                      Pricing & Costs (ETB)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Est. Labor Hours</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          value={editJobCardForm.estimated_labor_hours}
                          onChange={(e) => setEditJobCardForm({ ...editJobCardForm, estimated_labor_hours: e.target.value })}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Labor Cost (ETB)</Label>
                        <Input
                          type="number"
                          step="10"
                          min="0"
                          value={editJobCardForm.labor_cost}
                          onChange={(e) => setEditJobCardForm({ ...editJobCardForm, labor_cost: e.target.value })}
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Parts Cost (ETB)</Label>
                        <Input
                          type="number"
                          step="10"
                          min="0"
                          value={editJobCardForm.parts_cost}
                          onChange={(e) => setEditJobCardForm({ ...editJobCardForm, parts_cost: e.target.value })}
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Other Cost (ETB)</Label>
                        <Input
                          type="number"
                          step="10"
                          min="0"
                          value={editJobCardForm.other_cost}
                          onChange={(e) => setEditJobCardForm({ ...editJobCardForm, other_cost: e.target.value })}
                          className="h-8 text-xs font-mono font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button type="button" variant="outline" onClick={() => setEditingJobCard(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateJobCardMutation.isPending}
                      style={{ background: 'hsl(84 25% 30%)' }}
                      className="text-white"
                    >
                      {updateJobCardMutation.isPending ? 'Saving...' : 'Update Job Card'}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}