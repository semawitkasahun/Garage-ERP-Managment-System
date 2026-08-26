import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Send, Mail, MessageSquare, Calculator, XCircle, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useGenerateFromJobCards, useSendToCustomer, useCustomerApprove, useCustomerReject } from '../hooks/useQuotations';
import { useWorkOrder } from '@/features/workorders/hooks/useWorkOrders';
import { useAuthStore } from '@/features/auth/store/authStore';

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard', admin: '/admin/dashboard', technician: '/technician/dashboard',
  customer: '/customer/dashboard', supervisor: '/hr/dashboard', hr: '/hr/dashboard',
  finance: '/finance/dashboard', manager: '/manager/dashboard', employee: '/dashboard',
};

export function QuotationGeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, role } = useAuthStore();
  const workOrderId = searchParams.get('work_order_id');

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = [
    {
      label: 'Navigation',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
        { label: 'Work Orders', icon: Calculator, path: '/work-orders' },
      ],
    },
  ];

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendMethod, setSendMethod] = useState('email');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const generateQuotation = useGenerateFromJobCards();
  const sendToCustomer = useSendToCustomer();
  const customerApprove = useCustomerApprove();
  const customerReject = useCustomerReject();

  const { data: workOrder, isLoading: isLoadingWorkOrder } = useWorkOrder(workOrderId);

  const handleGenerate = async () => {
    try {
      await generateQuotation.mutateAsync({ work_order_id: Number(workOrderId) });
    } catch (error) {
      console.error('Failed to generate quotation:', error);
    }
  };

  const handleSend = async () => {
    try {
      await sendToCustomer.mutateAsync({
        id: workOrder?.quotation?.quotation_id,
        data: { sent_via: sendMethod },
      });
      setShowSendDialog(false);
    } catch (error) {
      console.error('Failed to send quotation:', error);
    }
  };

  const handleApprove = async () => {
    try {
      await customerApprove.mutateAsync(workOrder?.quotation?.quotation_id);
    } catch (error) {
      console.error('Failed to approve quotation:', error);
    }
  };

  const handleReject = async () => {
    try {
      await customerReject.mutateAsync({
        id: workOrder?.quotation?.quotation_id,
        data: { rejection_reason: rejectionReason },
      });
      setShowRejectDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject quotation:', error);
    }
  };

  if (isLoadingWorkOrder) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Generate Quotation" roleLabel={user?.username ?? 'Staff'}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading work order information...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const quotation = workOrder?.quotation;

  return (
    <DashboardLayout navSections={navSections} pageTitle="Generate Quotation" roleLabel={user?.username ?? 'Staff'}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/work-orders/${workOrderId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Work Order
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quotation</h1>
            <p className="text-muted-foreground">Work Order {workOrder?.work_order_number}</p>
          </div>
        </div>

        {!quotation ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Generate Quotation from Job Cards</h3>
                <p className="text-muted-foreground mb-4">
                  Create a customer quotation based on the job cards in this work order.
                </p>
                <div className="text-sm text-muted-foreground mb-6">
                  <p>Job Cards: {workOrder?.job_cards?.length || 0}</p>
                  <p>Estimated Total: ETB {workOrder?.job_cards?.reduce((sum, jc) => sum + (jc.estimated_total_cost || 0), 0)?.toLocaleString() || 0}</p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generateQuotation.isPending || (workOrder?.job_cards?.length || 0) === 0}
                  style={{ background: 'hsl(84 25% 30%)' }}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {generateQuotation.isPending ? 'Generating...' : 'Generate Quotation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quotation Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Quotation #{quotation.quotation_id}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground text-sm">Status:</span>
                    <p className="font-medium">{quotation.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">Customer Approval:</span>
                    <p className="font-medium">{quotation.customer_approval_status}</p>
                  </div>
                </div>

                {quotation.items && quotation.items.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-3">Quotation Items</h3>
                    <div className="space-y-2">
                      {quotation.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                          <div>
                            <span className="font-medium">{item.description}</span>
                            <span className="text-muted-foreground ml-2">x {item.quantity}</span>
                          </div>
                          <span className="font-medium">ETB {item.line_total?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">ETB {quotation.subtotal?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (15%):</span>
                    <span className="font-medium">ETB {quotation.tax_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-medium">ETB {quotation.discount_amount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>ETB {quotation.total_amount?.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quotation.status === 'draft' && (
                  <Button
                    onClick={() => setShowSendDialog(true)}
                    className="w-full"
                    style={{ background: 'hsl(84 25% 30%)' }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to Customer
                  </Button>
                )}

                {quotation.status === 'sent' && quotation.customer_approval_status === 'pending_approval' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      disabled={customerApprove.isPending}
                      className="flex-1"
                      style={{ background: 'hsl(84 25% 30%)' }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {customerApprove.isPending ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => setShowRejectDialog(true)}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}

                {quotation.customer_approval_status === 'approved' && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">Quotation approved by customer</span>
                  </div>
                )}

                {quotation.customer_approval_status === 'rejected' && quotation.rejection_reason && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Rejected:</span> {quotation.rejection_reason}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Send Dialog */}
        {showSendDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Send Quotation to Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Send Method</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={sendMethod === 'email' ? 'default' : 'outline'}
                      onClick={() => setSendMethod('email')}
                      className="flex flex-col gap-1"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                    <Button
                      variant={sendMethod === 'sms' ? 'default' : 'outline'}
                      onClick={() => setSendMethod('sms')}
                      className="flex flex-col gap-1"
                    >
                      <MessageSquare className="w-4 h-4" />
                      SMS
                    </Button>
                    <Button
                      variant={sendMethod === 'personal' ? 'default' : 'outline'}
                      onClick={() => setSendMethod('personal')}
                      className="flex flex-col gap-1"
                    >
                      <Send className="w-4 h-4" />
                      Personal
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={sendToCustomer.isPending}
                    style={{ background: 'hsl(84 25% 30%)' }}
                  >
                    {sendToCustomer.isPending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Reject Quotation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">Rejection Reason</Label>
                  <textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection"
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={customerReject.isPending || !rejectionReason}
                    variant="destructive"
                  >
                    {customerReject.isPending ? 'Rejecting...' : 'Reject'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}