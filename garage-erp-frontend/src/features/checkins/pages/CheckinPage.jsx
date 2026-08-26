import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Camera, Trash2, ClipboardCheck, LayoutDashboard, Plus, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Download, Printer, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getNavSections } from '@/layouts/navSections';
import { useCreateCheckin, useUploadCheckinMedia, useCheckinForm, useGetCheckin, useUpdateCheckin } from '@/features/checkins/hooks/useCheckins';
import { 
  useInspectionCategories, 
  useCreateInspection, 
  useUpdateInspection, 
  useSaveInspectionResults,
  useUploadInspectionPhoto,
  useDeleteInspectionPhoto,
  useCreateDamageRecord,
  useDeleteDamageRecord,
  useRecordCustomerSignature,
  useRecordSignatureDecline,
  useCompleteCheckin,
  useInspectionSummary,
  useInspectionReport,
  useSendInspectionReportEmail,
  useSendInspectionReportSMS
} from '@/features/checkins/hooks/useInspection';
import { SignaturePad } from '@/features/checkins/components/SignaturePad';

const FUEL_LEVELS = ['Empty', '1/4', '1/2', '3/4', 'Full'];
const DAMAGE_TYPES = ['scratch', 'dent', 'crack', 'broken_part', 'paint_damage', 'missing_part', 'other'];

const DAMAGE_TYPE_LABELS = {
  scratch: 'Scratch',
  dent: 'Dent',
  crack: 'Crack',
  broken_part: 'Broken Part',
  paint_damage: 'Paint Damage',
  missing_part: 'Missing Part',
  other: 'Other'
};

const STEPS = [
  { id: 1, name: 'Customer & Vehicle', status: 'pending' },
  { id: 2, name: 'Vehicle Intake', status: 'pending' },
  { id: 3, name: 'Inspection', status: 'pending' },
  { id: 4, name: 'Review', status: 'pending' },
  { id: 5, name: 'Signature', status: 'pending' },
  { id: 6, name: 'Complete', status: 'pending' },
];

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
  const [currentStep, setCurrentStep] = useState(1);
  const [checkinId, setCheckinId] = useState(null);
  const [inspectionId, setInspectionId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [steps, setSteps] = useState(STEPS);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({
    appointment_id: searchParams.get('appointmentId') ?? '',
    vehicle_id: searchParams.get('vehicleId') ?? '',
    customer_id: searchParams.get('customerId') ?? '',
    mileage_in: '', 
    fuel_level: '1/2', 
    customer_complaint: '', 
    key_tag_number: '',
    requested_services: [],
    inspection_notes: '',
  });

  const [inspectionResults, setInspectionResults] = useState({});
  const [inspectionPhotos, setInspectionPhotos] = useState({});
  const [damageRecords, setDamageRecords] = useState([]);
  const [signature, setSignature] = useState(null);
  const [signatureDeclineReason, setSignatureDeclineReason] = useState('');
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const createCheckin = useCreateCheckin();
  const uploadMedia = useUploadCheckinMedia();
  const formData = useCheckinForm(form.appointment_id);
  const getCheckin = useGetCheckin(checkinId);
  const updateCheckin = useUpdateCheckin();
  
  const { data: categories } = useInspectionCategories();
  const createInspection = useCreateInspection();
  const updateInspection = useUpdateInspection();
  const saveInspectionResults = useSaveInspectionResults();
  const uploadInspectionPhoto = useUploadInspectionPhoto();
  const deleteInspectionPhoto = useDeleteInspectionPhoto();
  const createDamageRecord = useCreateDamageRecord();
  const deleteDamageRecord = useDeleteDamageRecord();
  const recordCustomerSignature = useRecordCustomerSignature();
  const recordSignatureDecline = useRecordSignatureDecline();
  const completeCheckin = useCompleteCheckin();
  const { data: summary } = useInspectionSummary(checkinId);
  const { data: report } = useInspectionReport(checkinId && success ? checkinId : null);
  const sendInspectionReportEmail = useSendInspectionReportEmail();
  const sendInspectionReportSMS = useSendInspectionReportSMS();

  useEffect(() => {
    if (formData.data?.appointment) {
      if (formData.data.appointment.vehicle_id) set('vehicle_id', String(formData.data.appointment.vehicle_id));
      if (formData.data.appointment.customer_id) set('customer_id', String(formData.data.appointment.customer_id));
    }
  }, [formData.data]);

  useEffect(() => {
    if (getCheckin.data) {
      setForm(prev => ({
        ...prev,
        mileage_in: getCheckin.data.mileage_in || '',
        fuel_level: getCheckin.data.fuel_level || '1/2',
        customer_complaint: getCheckin.data.customer_complaint || '',
        key_tag_number: getCheckin.data.key_tag_number || '',
        inspection_notes: getCheckin.data.inspection_notes || '',
      }));
    }
  }, [getCheckin.data]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateStepStatus = (stepId, status) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const canProceedToStep = (step) => {
    switch (step) {
      case 2:
        return form.customer_id && form.vehicle_id;
      case 3:
        return form.mileage_in && form.fuel_level;
      case 4:
        return inspectionId && Object.keys(inspectionResults).length > 0;
      case 5:
        return true; // Can always proceed to signature step
      case 6:
        return true; // Signature is now optional
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!canProceedToStep(currentStep + 1)) {
      setError('Please complete all required fields before proceeding.');
      return;
    }

    setError(null);

    // Step 1 -> Step 2: Create checkin if not exists
    if (currentStep === 1 && !checkinId) {
      try {
        const { checkin } = await createCheckin.mutateAsync({
          appointment_id: form.appointment_id || null,
          vehicle_id: Number(form.vehicle_id),
          customer_id: Number(form.customer_id),
          mileage_in: form.mileage_in ? Number(form.mileage_in) : null,
          fuel_level: form.fuel_level || null,
          customer_complaint: form.customer_complaint || null,
          key_tag_number: form.key_tag_number || null,
          inspection_notes: form.inspection_notes || null,
        });
        setCheckinId(checkin.checkin_id);
        updateStepStatus(1, 'completed');
      } catch (err) {
        setError(err.response?.data?.message ?? 'Could not create check-in.');
        return;
      }
    }

    // Step 2 -> Step 3: Update intake info and create inspection
    if (currentStep === 2) {
      try {
        await updateCheckin.mutateAsync({
          checkinId,
          payload: {
            mileage_in: form.mileage_in ? Number(form.mileage_in) : null,
            fuel_level: form.fuel_level || null,
            customer_complaint: form.customer_complaint || null,
            key_tag_number: form.key_tag_number || null,
            inspection_notes: form.inspection_notes || null,
          }
        });

        const inspection = await createInspection.mutateAsync({
          checkinId,
          inspectorId: user.user_id,
        });
        setInspectionId(inspection.inspection_id);
        updateStepStatus(2, 'completed');
      } catch (err) {
        setError(err.response?.data?.message ?? 'Could not update intake information.');
        return;
      }
    }

    // Step 3 -> Step 4: Save inspection results and complete inspection
    if (currentStep === 3) {
      try {
        const resultsArray = Object.entries(inspectionResults).map(([itemId, data]) => ({
          inspection_item_id: Number(itemId),
          status: data.status,
          notes: data.notes || null,
        }));

        await saveInspectionResults.mutateAsync({
          inspectionId,
          results: resultsArray,
        });

        await updateInspection.mutateAsync({
          inspectionId,
          payload: {
            general_notes: form.inspection_notes || null,
            completed: true,
          }
        });

        updateStepStatus(3, 'completed');
      } catch (err) {
        setError(err.response?.data?.message ?? 'Could not save inspection results.');
        return;
      }
    }

    // Step 4 -> Step 5: Just navigation
    if (currentStep === 4) {
      updateStepStatus(4, 'completed');
    }

    // Step 5 -> Step 6: Record signature
    if (currentStep === 5) {
      try {
        if (signature) {
          await recordCustomerSignature.mutateAsync({
            checkinId,
            signature,
          });
        } else if (signatureDeclineReason) {
          await recordSignatureDecline.mutateAsync({
            checkinId,
            reason: signatureDeclineReason,
          });
        }
        // Refresh checkin data after signature is recorded
        await getCheckin.refetch();
        updateStepStatus(5, 'completed');
      } catch (err) {
        setError(err.response?.data?.message ?? 'Could not record signature.');
        return;
      }
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleCompleteCheckin = async () => {
    try {
      // Refresh checkin data before completing to ensure we have the latest signature status
      await getCheckin.refetch();
      await completeCheckin.mutateAsync(checkinId);
      setSuccess(true);
      updateStepStatus(6, 'completed');
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not complete check-in.');
    }
  };

  const handleInspectionResultChange = (itemId, field, value) => {
    setInspectionResults(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      }
    }));
  };

  const handleInspectionPhotoUpload = async (itemId, file) => {
    if (!file) return;
    
    try {
      // First, create the inspection result if it doesn't exist
      if (!inspectionResults[itemId]) {
        handleInspectionResultChange(itemId, 'status', 'ok');
      }

      // For now, we'll store the photo locally
      // In a real implementation, you'd upload it to the server and get back a photo ID
      const photoUrl = URL.createObjectURL(file);
      
      setInspectionPhotos(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), { file, url: photoUrl }]
      }));
    } catch (err) {
      setError('Could not upload photo');
    }
  };

  const handleInspectionPhotoRemove = (itemId, photoIndex) => {
    setInspectionPhotos(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.filter((_, i) => i !== photoIndex) || []
    }));
  };

  const handleAddDamageRecord = async (damageData) => {
    try {
      const damage = await createDamageRecord.mutateAsync({
        checkinId,
        damageData,
      });
      setDamageRecords(prev => [...prev, damage]);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not add damage record.');
    }
  };

  const handleDeleteDamageRecord = async (damageId) => {
    try {
      await deleteDamageRecord.mutateAsync(damageId);
      setDamageRecords(prev => prev.filter(d => d.damage_id !== damageId));
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not delete damage record.');
    }
  };

  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';
  const navSections = getNavSections(role);

  const apt = formData.data?.appointment;
  const isSubmitting = createCheckin.isPending || uploadMedia.isPending || updateCheckin.isPending || 
                     createInspection.isPending || saveInspectionResults.isPending || updateInspection.isPending ||
                     recordCustomerSignature.isPending || recordSignatureDecline.isPending || completeCheckin.isPending;

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

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.status === 'completed' ? 'bg-green-600 text-white' :
                  step.id === currentStep ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs mt-2 ${
                  step.id === currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  step.status === 'completed' ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-800">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm">Check-In completed successfully!</span>
        </div>
      )}

      {/* Step Content */}
      <div className="max-w-5xl">
        {currentStep === 1 && (
          <Step1CustomerVehicle 
            form={form} 
            set={set} 
            apt={apt} 
            user={user} 
          />
        )}

        {currentStep === 2 && (
          <Step2VehicleIntake 
            form={form} 
            set={set} 
            FUEL_LEVELS={FUEL_LEVELS}
          />
        )}

        {currentStep === 3 && (
          <Step3Inspection 
            categories={categories} 
            inspectionResults={inspectionResults}
            handleInspectionResultChange={handleInspectionResultChange}
            damageRecords={damageRecords}
            handleAddDamageRecord={handleAddDamageRecord}
            handleDeleteDamageRecord={handleDeleteDamageRecord}
            DAMAGE_TYPES={DAMAGE_TYPES}
            DAMAGE_TYPE_LABELS={DAMAGE_TYPE_LABELS}
            inspectionPhotos={inspectionPhotos}
            handleInspectionPhotoUpload={handleInspectionPhotoUpload}
            handleInspectionPhotoRemove={handleInspectionPhotoRemove}
          />
        )}

        {currentStep === 4 && (
          <Step4Review 
            form={form}
            apt={apt}
            inspectionResults={inspectionResults}
            categories={categories}
            damageRecords={damageRecords}
            summary={summary}
            DAMAGE_TYPE_LABELS={DAMAGE_TYPE_LABELS}
          />
        )}

        {currentStep === 5 && (
          <Step5Signature 
            signature={signature}
            setSignature={setSignature}
            signatureDeclineReason={signatureDeclineReason}
            setSignatureDeclineReason={setSignatureDeclineReason}
            showDeclineModal={showDeclineModal}
            setShowDeclineModal={setShowDeclineModal}
            form={form}
            apt={apt}
            inspectionResults={inspectionResults}
            categories={categories}
            damageRecords={damageRecords}
            DAMAGE_TYPE_LABELS={DAMAGE_TYPE_LABELS}
            checkinId={checkinId}
          />
        )}

        {currentStep === 6 && (
          <Step6Complete 
            success={success}
            checkinId={checkinId}
            onWorkOrderCreate={async () => {
              if (!checkinId) return;
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
              }
            }}
            report={report}
            sendInspectionReportEmail={sendInspectionReportEmail}
            sendInspectionReportSMS={sendInspectionReportSMS}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 6 && (
        <div className="flex items-center justify-between pt-8 pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          <Button
            type="button"
            onClick={currentStep === 5 ? handleCompleteCheckin : handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2"
            style={{ background: 'hsl(84 25% 30%)' }}
          >
            {isSubmitting ? 'Processing...' : currentStep === 5 ? 'Complete Check-In' : 'Next'}
            {currentStep < 5 && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
}

// Step Components
function Step1CustomerVehicle({ form, set, apt, user }) {
  return (
    <div className="space-y-6">
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
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Previous Mileage</Label>
            <div className="font-semibold mt-1.5">{apt?.vehicle?.mileage ? `${apt.vehicle.mileage.toLocaleString()} km` : 'N/A'}</div>
          </div>
          <div className="pt-2">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Vehicle ID</Label>
            {apt ? (
              <div className="font-medium mt-1.5">{apt.vehicle_id}</div>
            ) : (
              <Input type="number" className="h-8 text-xs" value={form.vehicle_id} onChange={(e) => set('vehicle_id', e.target.value)} required placeholder="Vehicle ID" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2VehicleIntake({ form, set, FUEL_LEVELS }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Vehicle Intake Information</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-4">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Current Mileage *</Label>
            <Input type="number" placeholder="Mileage in km" value={form.mileage_in} onChange={(e) => set('mileage_in', e.target.value)} className="h-8 text-xs" required />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Fuel Level *</Label>
            <select 
              value={form.fuel_level} 
              onChange={(e) => set('fuel_level', e.target.value)}
              className="h-8 text-xs rounded-md border border-input bg-background px-3 py-1"
              required
            >
              {FUEL_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Key/Tag Number</Label>
            <Input value={form.key_tag_number} onChange={(e) => set('key_tag_number', e.target.value)} className="h-8 text-xs" placeholder="e.g. K-123" />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Customer Complaint & Service Request</h2>
        <div className="space-y-4">
          <div>
            <Label className="text-xs mb-2 block font-medium">Customer Complaint *</Label>
            <textarea
              value={form.customer_complaint}
              onChange={(e) => set('customer_complaint', e.target.value)}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Describe the issues reported by the customer..."
              required
            />
          </div>
          <div>
            <Label className="text-xs mb-2 block font-medium">Additional Inspection Notes</Label>
            <textarea
              value={form.inspection_notes}
              onChange={(e) => set('inspection_notes', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Any additional notes for the inspection..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3Inspection({ categories, inspectionResults, handleInspectionResultChange, damageRecords, handleAddDamageRecord, handleDeleteDamageRecord, DAMAGE_TYPES, DAMAGE_TYPE_LABELS, inspectionPhotos, handleInspectionPhotoUpload, handleInspectionPhotoRemove }) {
  const [newDamage, setNewDamage] = useState({ damage_type: 'scratch', location: '', description: '', photo: null });

  const handleAddDamage = async () => {
    if (!newDamage.location) return;
    
    const formData = new FormData();
    formData.append('damage_type', newDamage.damage_type);
    formData.append('location', newDamage.location);
    if (newDamage.description) formData.append('description', newDamage.description);
    if (newDamage.photo) formData.append('photo', newDamage.photo);

    await handleAddDamageRecord(formData);
    setNewDamage({ damage_type: 'scratch', location: '', description: '', photo: null });
  };

  return (
    <div className="space-y-6">
      {categories?.map(category => (
        <div key={category.category_id} className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h2 className="font-display text-sm font-semibold tracking-tight mb-4">{category.display_name}</h2>
          <div className="space-y-3">
            {category.items?.map(item => (
              <div key={item.item_id} className="flex flex-col gap-2 border-b border-border pb-3 last:border-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <span className="text-sm font-medium w-48 shrink-0">{item.display_name}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {['ok', 'needs_attention', 'na'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleInspectionResultChange(item.item_id, 'status', status)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
                          inspectionResults[item.item_id]?.status === status
                            ? status === 'ok' ? 'bg-green-600 text-white border-green-600' :
                              status === 'needs_attention' ? 'bg-yellow-500 text-white border-yellow-500' :
                              'bg-gray-400 text-white border-gray-400'
                            : 'bg-transparent text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {status === 'ok' ? '✓ OK' : status === 'needs_attention' ? '⚠ Needs Attention' : 'N/A'}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={inspectionResults[item.item_id]?.notes || ''}
                    onChange={(e) => handleInspectionResultChange(item.item_id, 'notes', e.target.value)}
                    placeholder="Notes (optional)"
                    className="sm:max-w-[220px] h-8 text-xs"
                  />
                </div>
                
                {/* Photo Upload for this item */}
                <div className="flex items-center gap-2 ml-0 sm:ml-56">
                  <label className="flex items-center gap-1 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    <Camera className="w-3 h-3" />
                    <span>+ Add Photo</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleInspectionPhotoUpload(item.item_id, e.target.files[0])}
                    />
                  </label>
                  
                  {/* Photo previews */}
                  {inspectionPhotos[item.item_id]?.length > 0 && (
                    <div className="flex gap-2">
                      {inspectionPhotos[item.item_id].map((photo, photoIndex) => (
                        <div key={photoIndex} className="relative group">
                          <img 
                            src={photo.url} 
                            alt="Inspection photo" 
                            className="w-12 h-12 object-cover rounded border border-border"
                          />
                          <button
                            type="button"
                            onClick={() => handleInspectionPhotoRemove(item.item_id, photoIndex)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Vehicle Damage Section */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Existing Vehicle Damage</h2>
        
        {/* Add New Damage */}
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <Label className="text-xs mb-1 block">Damage Type</Label>
              <select 
                value={newDamage.damage_type}
                onChange={(e) => setNewDamage(prev => ({ ...prev, damage_type: e.target.value }))}
                className="h-8 text-xs rounded-md border border-input bg-background px-3 py-1"
              >
                {DAMAGE_TYPES.map(type => (
                  <option key={type} value={type}>{DAMAGE_TYPE_LABELS[type]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Location *</Label>
              <Input 
                value={newDamage.location}
                onChange={(e) => setNewDamage(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Rear left door"
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="mb-3">
            <Label className="text-xs mb-1 block">Description</Label>
            <Input 
              value={newDamage.description}
              onChange={(e) => setNewDamage(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the damage..."
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-xs mb-1 block">Photo (Optional)</Label>
              <Input 
                type="file"
                accept="image/*"
                onChange={(e) => setNewDamage(prev => ({ ...prev, photo: e.target.files[0] }))}
                className="h-8 text-xs"
              />
            </div>
            <Button 
              type="button" 
              onClick={handleAddDamage}
              disabled={!newDamage.location}
              className="text-xs h-8"
            >
              Add Damage Record
            </Button>
          </div>
        </div>

        {/* Damage Records List */}
        {damageRecords.length > 0 && (
          <div className="space-y-2">
            {damageRecords.map(damage => (
              <div key={damage.damage_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="text-sm font-medium">{DAMAGE_TYPE_LABELS[damage.damage_type]} - {damage.location}</div>
                  {damage.description && <div className="text-xs text-muted-foreground">{damage.description}</div>}
                  {damage.photo_path && <div className="text-xs text-blue-600 mt-1">Photo attached</div>}
                </div>
                <Button 
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteDamageRecord(damage.damage_id)}
                  className="h-8 text-xs"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Step4Review({ form, apt, inspectionResults, categories, damageRecords, summary, DAMAGE_TYPE_LABELS }) {
  const okCount = Object.values(inspectionResults).filter(r => r.status === 'ok').length;
  const needsAttentionCount = Object.values(inspectionResults).filter(r => r.status === 'needs_attention').length;
  const naCount = Object.values(inspectionResults).filter(r => r.status === 'na').length;
  const totalCount = Object.keys(inspectionResults).length;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Check-In Summary</h2>
        
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Customer</Label>
            <div className="font-medium">{apt?.customer ? `${apt.customer.first_name} ${apt.customer.last_name}` : 'N/A'}</div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Vehicle</Label>
            <div className="font-medium">{apt?.vehicle ? `${apt.vehicle.year} ${apt.vehicle.make} ${apt.vehicle.model}` : 'N/A'}</div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">VIN</Label>
            <div className="font-medium text-xs">{apt?.vehicle?.vin || 'N/A'}</div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Plate Number</Label>
            <div className="font-medium">{apt?.vehicle?.plate_number || 'N/A'}</div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Mileage</Label>
            <div className="font-medium">{form.mileage_in ? `${Number(form.mileage_in).toLocaleString()} km` : 'N/A'}</div>
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">Fuel Level</Label>
            <div className="font-medium">{form.fuel_level || 'N/A'}</div>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="font-display text-sm font-semibold tracking-tight mb-3">Inspection Results</h3>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">{okCount}</div>
              <div className="text-xs text-green-700">OK</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-md">
              <div className="text-2xl font-bold text-yellow-600">{needsAttentionCount}</div>
              <div className="text-xs text-yellow-700">Needs Attention</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-2xl font-bold text-gray-600">{naCount}</div>
              <div className="text-xs text-gray-700">N/A</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-xs text-blue-700">Total Items</div>
            </div>
          </div>
        </div>

        {damageRecords.length > 0 && (
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-display text-sm font-semibold tracking-tight mb-3">Existing Damage ({damageRecords.length})</h3>
            <div className="space-y-2">
              {damageRecords.map(damage => (
                <div key={damage.damage_id} className="text-sm p-2 bg-gray-50 rounded">
                  <span className="font-medium">{DAMAGE_TYPE_LABELS[damage.damage_type] || damage.damage_type}</span> - {damage.location}
                  {damage.description && <span className="text-muted-foreground ml-2">({damage.description})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4 mt-4">
          <h3 className="font-display text-sm font-semibold tracking-tight mb-2">Customer Complaint</h3>
          <p className="text-sm text-muted-foreground">{form.customer_complaint || 'None'}</p>
        </div>

        {form.inspection_notes && (
          <div className="border-t border-border pt-4 mt-4">
            <h3 className="font-display text-sm font-semibold tracking-tight mb-2">Inspection Notes</h3>
            <p className="text-sm text-muted-foreground">{form.inspection_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Step5Signature({ signature, setSignature, signatureDeclineReason, setSignatureDeclineReason, showDeclineModal, setShowDeclineModal, form, apt, inspectionResults, categories, damageRecords, DAMAGE_TYPE_LABELS, checkinId }) {
  const handlePrint = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePrintContent = () => {
    const okCount = Object.values(inspectionResults).filter(r => r.status === 'ok').length;
    const needsAttentionCount = Object.values(inspectionResults).filter(r => r.status === 'needs_attention').length;
    const naCount = Object.values(inspectionResults).filter(r => r.status === 'na').length;
    const totalCount = Object.keys(inspectionResults).length;

    let html = `
      <html>
      <head>
        <title>Vehicle Inspection Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; }
          .info-item { margin-bottom: 8px; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
          .summary-item { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .summary-number { font-size: 24px; font-weight: bold; }
          .summary-label { font-size: 12px; color: #666; }
          .inspection-item { padding: 8px 0; border-bottom: 1px solid #eee; }
          .item-name { font-weight: 500; }
          .item-status { margin-left: 10px; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
          .status-ok { background: #d4edda; color: #155724; }
          .status-attention { background: #fff3cd; color: #856404; }
          .status-na { background: #e2e3e5; color: #383d41; }
          .damage-item { padding: 10px; background: #f8f9fa; border-radius: 5px; margin-bottom: 10px; }
          .complaint-box { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
          .signature-section { margin-top: 30px; padding: 20px; border: 2px solid #333; border-radius: 5px; }
          .signature-line { margin-top: 40px; border-top: 1px solid #333; width: 300px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>VEHICLE INSPECTION REPORT</h1>
          <p>Check-In ID: ${checkinId || 'Pending'}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <div class="section-title">CUSTOMER INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Name:</span>
              <span class="value">${apt?.customer ? `${apt.customer.first_name} ${apt.customer.last_name}` : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Phone:</span>
              <span class="value">${apt?.customer?.phone || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Email:</span>
              <span class="value">${apt?.customer?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">VEHICLE INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Make:</span>
              <span class="value">${apt?.vehicle?.make || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Model:</span>
              <span class="value">${apt?.vehicle?.model || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Year:</span>
              <span class="value">${apt?.vehicle?.year || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">VIN:</span>
              <span class="value">${apt?.vehicle?.vin || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Plate Number:</span>
              <span class="value">${apt?.vehicle?.plate_number || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Mileage:</span>
              <span class="value">${form.mileage_in ? `${Number(form.mileage_in).toLocaleString()} km` : 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Fuel Level:</span>
              <span class="value">${form.fuel_level || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">INSPECTION SUMMARY</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-number" style="color: #28a745;">${okCount}</div>
              <div class="summary-label">OK</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #ffc107;">${needsAttentionCount}</div>
              <div class="summary-label">Needs Attention</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #6c757d;">${naCount}</div>
              <div class="summary-label">N/A</div>
            </div>
            <div class="summary-item">
              <div class="summary-number" style="color: #007bff;">${totalCount}</div>
              <div class="summary-label">Total Items</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">INSPECTION DETAILS</div>
          ${categories?.map(category => `
            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">${category.display_name}</h3>
              ${category.items?.map(item => {
                const result = inspectionResults[item.item_id];
                const statusClass = result?.status === 'ok' ? 'status-ok' : 
                                   result?.status === 'needs_attention' ? 'status-attention' : 'status-na';
                const statusLabel = result?.status === 'ok' ? 'OK' : 
                                    result?.status === 'needs_attention' ? 'Needs Attention' : 'N/A';
                return `
                  <div class="inspection-item">
                    <span class="item-name">${item.display_name}</span>
                    <span class="item-status ${statusClass}">${statusLabel}</span>
                    ${result?.notes ? `<div style="margin-left: 10px; font-size: 12px; color: #666;">Note: ${result.notes}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `).join('')}
        </div>

        ${damageRecords.length > 0 ? `
          <div class="section">
            <div class="section-title">EXISTING DAMAGE (${damageRecords.length})</div>
            ${damageRecords.map(damage => `
              <div class="damage-item">
                <strong>${DAMAGE_TYPE_LABELS[damage.damage_type] || damage.damage_type}</strong> - ${damage.location}
                ${damage.description ? `<div style="font-size: 12px; color: #666; margin-top: 5px;">${damage.description}</div>` : ''}
                ${damage.photo_path ? `<div style="font-size: 12px; color: #007bff; margin-top: 5px;">Photo attached</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">CUSTOMER COMPLAINT</div>
          <div class="complaint-box">
            ${form.customer_complaint || 'None specified'}
          </div>
        </div>

        ${form.inspection_notes ? `
          <div class="section">
            <div class="section-title">ADDITIONAL INSPECTION NOTES</div>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
              ${form.inspection_notes}
            </div>
          </div>
        ` : ''}

        <div class="signature-section">
          <div class="section-title">CUSTOMER ACKNOWLEDGEMENT</div>
          <p style="margin-bottom: 20px;">By signing below, the customer acknowledges that they have reviewed the recorded vehicle condition and existing damage at the time of check-in.</p>
          <div class="signature-line"></div>
          <p style="margin-top: 10px; font-size: 12px;">Customer Signature</p>
          <div class="signature-line" style="margin-top: 30px;"></div>
          <p style="margin-top: 10px; font-size: 12px;">Date</p>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>This report was generated by Garage ERP System</p>
          <p>Report ID: ${checkinId || 'PENDING'} | Generated: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    return html;
  };
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold tracking-tight">Customer Inspection Acknowledgement</h2>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="text-xs flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </Button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <p className="text-sm text-blue-800">
            By signing, the customer confirms that they have reviewed the recorded vehicle condition and existing damage at the time of check-in.
          </p>
        </div>

        <div className="mb-4">
          <Label className="text-xs mb-2 block font-medium">Customer</Label>
          <div className="text-sm font-medium">
            {apt?.customer ? `${apt.customer.first_name} ${apt.customer.last_name}` : 'N/A'}
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-xs mb-2 block font-medium">Digital Signature (Optional)</Label>
          <SignaturePad onChange={setSignature} />
          <p className="text-xs text-muted-foreground mt-2">Signature is optional but recommended for documentation purposes</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setSignature(null)}
            className="text-xs"
          >
            Clear Signature
          </Button>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-3">If customer refuses to sign:</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeclineModal(true)}
            className="text-xs"
          >
            Customer Declined Signature
          </Button>
        </div>

        {showDeclineModal && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <Label className="text-xs mb-2 block font-medium text-red-800">Reason for Decline *</Label>
            <textarea
              value={signatureDeclineReason}
              onChange={(e) => setSignatureDeclineReason(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Please provide the reason why the customer declined to sign..."
              required
            />
            <div className="flex gap-2 mt-3">
              <Button
                type="button"
                onClick={() => setShowDeclineModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeclineModal(false)}
                className="text-xs"
              >
                Confirm Decline
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step6Complete({ success, checkinId, onWorkOrderCreate, report, sendInspectionReportEmail, sendInspectionReportSMS }) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // This would typically generate a PDF from the report data
    // For now, we'll create a simple text-based report
    if (report) {
      const reportContent = generateTextReport(report);
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspection-report-${checkinId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleSendEmail = async () => {
    try {
      await sendInspectionReportEmail.mutateAsync(checkinId);
      alert('Inspection report email sent successfully!');
    } catch (error) {
      alert('Failed to send email: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSendSMS = async () => {
    try {
      await sendInspectionReportSMS.mutateAsync(checkinId);
      alert('Inspection report SMS sent successfully!');
    } catch (error) {
      alert('Failed to send SMS: ' + (error.response?.data?.message || error.message));
    }
  };

  const generateTextReport = (data) => {
    const checkin = data.checkin;
    const summary = data.summary;
    
    let report = `VEHICLE INSPECTION REPORT\n`;
    report += `========================\n\n`;
    report += `Check-In ID: ${checkin.checkin_id}\n`;
    report += `Date: ${new Date(checkin.checked_in_at).toLocaleDateString()}\n\n`;
    
    report += `CUSTOMER INFORMATION\n`;
    report += `--------------------\n`;
    report += `Name: ${checkin.customer?.first_name} ${checkin.customer?.last_name}\n`;
    report += `Phone: ${checkin.customer?.phone || 'N/A'}\n`;
    report += `Email: ${checkin.customer?.email || 'N/A'}\n\n`;
    
    report += `VEHICLE INFORMATION\n`;
    report += `-------------------\n`;
    report += `Make: ${checkin.vehicle?.make || 'N/A'}\n`;
    report += `Model: ${checkin.vehicle?.model || 'N/A'}\n`;
    report += `Year: ${checkin.vehicle?.year || 'N/A'}\n`;
    report += `VIN: ${checkin.vehicle?.vin || 'N/A'}\n`;
    report += `Plate: ${checkin.vehicle?.plate_number || 'N/A'}\n`;
    report += `Mileage: ${checkin.mileage_in ? `${checkin.mileage_in.toLocaleString()} km` : 'N/A'}\n`;
    report += `Fuel Level: ${checkin.fuel_level || 'N/A'}\n\n`;
    
    report += `INSPECTION SUMMARY\n`;
    report += `------------------\n`;
    report += `Total Items: ${summary.total_items}\n`;
    report += `OK: ${summary.ok}\n`;
    report += `Needs Attention: ${summary.needs_attention}\n`;
    report += `N/A: ${summary.na}\n\n`;
    
    if (data.damage_records && data.damage_records.length > 0) {
      report += `EXISTING DAMAGE\n`;
      report += `---------------\n`;
      data.damage_records.forEach((damage, index) => {
        report += `${index + 1}. ${damage.type} - ${damage.location}\n`;
        if (damage.description) report += `   Description: ${damage.description}\n`;
        report += `\n`;
      });
    }
    
    report += `CUSTOMER COMPLAINT\n`;
    report += `------------------\n`;
    report += `${checkin.customer_complaint || 'None'}\n\n`;
    
    if (checkin.inspection_notes) {
      report += `INSPECTION NOTES\n`;
      report += `----------------\n`;
      report += `${checkin.inspection_notes}\n\n`;
    }
    
    report += `INSPECTOR\n`;
    report += `---------\n`;
    report += `${checkin.checkinInspection?.inspector?.employee?.first_name || 'N/A'} ${checkin.checkinInspection?.inspector?.employee?.last_name || 'N/A'}\n\n`;
    
    report += `SIGNATURE\n`;
    report += `---------\n`;
    report += `Customer signature recorded on: ${checkin.customer_signed_at ? new Date(checkin.customer_signed_at).toLocaleString() : 'N/A'}\n`;
    
    return report;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight mb-2">Check-In Completed Successfully!</h2>
            <p className="text-muted-foreground mb-6">The vehicle has been checked in and the inspection has been recorded.</p>
            
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <div className="text-sm">
                <span className="font-medium">Check-In ID:</span> {checkinId}
              </div>
            </div>

            {/* Report Actions */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrint}
                className="text-xs flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadPDF}
                className="text-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Report
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendEmail}
                disabled={sendInspectionReportEmail.isPending}
                className="text-xs flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {sendInspectionReportEmail.isPending ? 'Sending...' : 'Send Email'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendSMS}
                disabled={sendInspectionReportSMS.isPending}
                className="text-xs flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {sendInspectionReportSMS.isPending ? 'Sending...' : 'Send SMS'}
              </Button>
            </div>

            <Button
              type="button"
              onClick={onWorkOrderCreate}
              className="text-sm"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              Create Work Order
            </Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="font-display text-xl font-semibold tracking-tight mb-2">Ready to Complete Check-In</h2>
            <p className="text-muted-foreground mb-6">Please review all information and complete the check-in process.</p>
          </>
        )}
      </div>
    </div>
  );
}
