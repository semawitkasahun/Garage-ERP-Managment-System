import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, User, Clock, DollarSign, LayoutDashboard, Plus, Trash2, Save, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useCreateJobCard } from '../hooks/useJobCards';
import { useWorkOrder } from '@/features/workorders/hooks/useWorkOrders';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTechnicians } from '@/features/appointments/hooks/useAppointments';
import { SERVICE_CATEGORIES, JOB_CARD_PRIORITIES, JOB_CARD_STATUSES, getCategoryForService } from '@/constants/serviceCategories';

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function JobCardCreatePage() {
  const navigate = useNavigate();
  const { id: workOrderId } = useParams();
  const { user, role } = useAuthStore();

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

  const [form, setForm] = useState({
    work_order_id: workOrderId,
    step_number: 1,
    job_title: '',
    service_category: '',
    description: '',
    customer_complaint_related: '',
    priority: 'normal',
    status: 'draft',
    assigned_technician_id: '',
    estimated_labor_hours: '',
    labor_cost: '',
    parts_cost: '',
    other_cost: '',
  });

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createJobCard = useCreateJobCard();
  const { data: workOrder, isLoading: isLoadingWorkOrder } = useWorkOrder(workOrderId);
  const { data: technicians } = useTechnicians(workOrder?.branch_id || user?.branch_id);

  useEffect(() => {
    if (workOrder) {
      const nextStep = (workOrder.job_cards?.length || 0) + 1;
      setForm(prev => ({
        ...prev,
        step_number: nextStep,
        customer_complaint_related: workOrder.checkin?.customer_complaint || prev.customer_complaint_related,
      }));
    }
  }, [workOrder]);

  const calculateEstimatedTotal = () => {
    const laborCost = parseFloat(form.labor_cost) || 0;
    const partsCost = parseFloat(form.parts_cost) || 0;
    const otherCost = parseFloat(form.other_cost) || 0;
    return laborCost + partsCost + otherCost;
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(SERVICE_CATEGORIES.find(cat => cat.id === categoryId));
    setForm({ ...form, service_category: categoryId });
  };

  const handleServiceSelect = (serviceName) => {
    setForm({ ...form, job_title: serviceName });
    setShowServiceSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const estimatedTotal = calculateEstimatedTotal();
      const jobCardData = {
        ...form,
        estimated_labor_hours: parseFloat(form.estimated_labor_hours) || 0,
        labor_cost: parseFloat(form.labor_cost) || 0,
        parts_cost: parseFloat(form.parts_cost) || 0,
        other_cost: parseFloat(form.other_cost) || 0,
        estimated_total_cost: estimatedTotal,
      };

      await createJobCard.mutateAsync(jobCardData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/work-orders/${workOrderId}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create job card');
    }
  };

  if (isLoadingWorkOrder) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Create Job Card" roleLabel={user?.username ?? 'Staff'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading work order information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navSections={navSections} pageTitle="Create Job Card" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/work-orders/${workOrderId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Work Order
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create Job Card</h1>
            <p className="text-muted-foreground">
              Work Order: {workOrder?.work_order_number}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Job card created successfully! Redirecting...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Job Card Form */}
        <Card>
          <CardHeader>
            <CardTitle>Job Card Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Service Classification */}
              <div className="space-y-4">
                <h3 className="font-semibold">Service Classification</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="service_category">Service Category</Label>
                  <select
                    id="service_category"
                    value={form.service_category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Category</option>
                    {SERVICE_CATEGORIES.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job_title">Service Name *</Label>
                  <div className="relative">
                    <Input
                      id="job_title"
                      value={form.job_title}
                      onChange={(e) => {
                        setForm({ ...form, job_title: e.target.value });
                        setShowServiceSuggestions(e.target.value.length > 2);
                      }}
                      placeholder="e.g., Engine Oil Change"
                      required
                    />
                    {showServiceSuggestions && selectedCategory && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {selectedCategory.services
                          .filter(service => 
                            service.toLowerCase().includes(form.job_title.toLowerCase())
                          )
                          .map((service, index) => (
                            <div
                              key={index}
                              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                              onClick={() => handleServiceSelect(service)}
                            >
                              {service}
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed description of the work to be performed"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_complaint_related">Customer Complaint Related</Label>
                  <textarea
                    id="customer_complaint_related"
                    value={form.customer_complaint_related}
                    onChange={(e) => setForm({ ...form, customer_complaint_related: e.target.value })}
                    placeholder="How this job relates to the customer's complaint"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="step_number">Service Step #</Label>
                    <Input
                      id="step_number"
                      type="number"
                      min="1"
                      value={form.step_number}
                      onChange={(e) => setForm({ ...form, step_number: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {JOB_CARD_PRIORITIES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {JOB_CARD_STATUSES.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assigned_technician_id">Assigned Technician</Label>
                    <select
                      id="assigned_technician_id"
                      value={form.assigned_technician_id}
                      onChange={(e) => setForm({ ...form, assigned_technician_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md bg-background text-sm"
                    >
                      <option value="">Select Technician (or leave unassigned)</option>
                      {technicians && technicians.map((tech) => (
                        <option key={tech.user_id} value={tech.user_id}>
                          {tech.username || `${tech.first_name || ''} ${tech.last_name || ''}`.trim()} {tech.employee?.job_title ? `(${tech.employee.job_title})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Labor Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Labor Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estimated_labor_hours">Estimated Labor Hours *</Label>
                    <Input
                      id="estimated_labor_hours"
                      type="number"
                      step="0.1"
                      value={form.estimated_labor_hours}
                      onChange={(e) => setForm({ ...form, estimated_labor_hours: e.target.value })}
                      placeholder="e.g., 2.5"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="labor_cost">Labor Cost (ETB) *</Label>
                    <Input
                      id="labor_cost"
                      type="number"
                      step="0.01"
                      value={form.labor_cost}
                      onChange={(e) => setForm({ ...form, labor_cost: e.target.value })}
                      placeholder="e.g., 500.00"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Parts Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Parts Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="parts_cost">Parts Cost (ETB)</Label>
                  <Input
                    id="parts_cost"
                    type="number"
                    step="0.01"
                    value={form.parts_cost}
                    onChange={(e) => setForm({ ...form, parts_cost: e.target.value })}
                    placeholder="e.g., 1500.00"
                  />
                </div>
              </div>

              {/* Other Costs */}
              <div className="space-y-4">
                <h3 className="font-semibold">Other Costs</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="other_cost">Other Costs (ETB)</Label>
                  <Input
                    id="other_cost"
                    type="number"
                    step="0.01"
                    value={form.other_cost}
                    onChange={(e) => setForm({ ...form, other_cost: e.target.value })}
                    placeholder="e.g., 200.00"
                  />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Cost Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Labor Cost:</span>
                    <span>ETB {parseFloat(form.labor_cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parts Cost:</span>
                    <span>ETB {parseFloat(form.parts_cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Costs:</span>
                    <span>ETB {parseFloat(form.other_cost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Estimated Total:</span>
                    <span>ETB {calculateEstimatedTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/work-orders/${workOrderId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createJobCard.isPending}
                  style={{ background: 'hsl(84 25% 30%)' }}
                >
                  {createJobCard.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Job Card
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}