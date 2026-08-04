import React, { useEffect, useState } from 'react';
import { 
  X, Calendar, Clock, User, Phone, Mail, MapPin, 
  Car, Wrench, Edit, AlertCircle, CheckCircle2, Ban, XCircle, Printer
} from 'lucide-react';
import { useUpdateAppointmentStatus } from '@/features/appointments/hooks/useAppointments';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AppointmentDrawer({ appointment, isOpen, onClose, onEdit }) {
  const [mounted, setMounted] = useState(false);
  const updateStatus = useUpdateAppointmentStatus();

  // Handle animation mount/unmount
  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setMounted(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted && !isOpen) return null;

  const handleStatusChange = (status) => {
    if (!appointment) return;
    updateStatus.mutate({ appointmentId: appointment.appointment_id, status });
  };

  const a = appointment;
  if (!a) return null;

  const customerName = a.customer 
    ? `${a.customer.first_name ?? ''} ${a.customer.last_name ?? ''}`.trim() 
    : a.customer_name;
  
  const vehicleName = a.vehicle
    ? `${a.vehicle.year ?? ''} ${a.vehicle.make ?? ''} ${a.vehicle.model ?? ''}`.trim()
    : a.vehicle_name;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div 
        onAnimationEnd={handleAnimationEnd}
        className={`relative w-full max-w-md bg-background h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Appointment Details</h2>
            <p className="text-sm text-muted-foreground mt-0.5">#{a.appointment_id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            
            {/* Status & Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-accent text-accent-foreground border border-border">
                {a.status.replace('_', ' ')}
              </div>
              {a.status === 'booked' && (
                <button 
                  onClick={() => handleStatusChange('confirmed')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                >
                  Confirm
                </button>
              )}
              {(a.status === 'booked' || a.status === 'confirmed') && (
                <button 
                  onClick={() => handleStatusChange('checked_in')}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Check In
                </button>
              )}
            </div>

            {/* Time & Assignment */}
            <div className="grid grid-cols-2 gap-6 bg-muted/30 p-4 rounded-xl border border-border">
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" /> Date
                </div>
                <div className="font-medium text-foreground">{formatDate(a.scheduled_start)}</div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" /> Time
                </div>
                <div className="font-medium text-foreground">
                  {formatTime(a.scheduled_start)}
                  {a.scheduled_end && ` – ${formatTime(a.scheduled_end)}`}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Wrench className="h-4 w-4" /> Bay
                </div>
                <div className="font-medium text-foreground">
                  {a.bay ? a.bay.name : 'Unassigned'}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div>
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Customer</h3>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {(customerName[0] ?? '?').toUpperCase()}
                </div>
                <div className="space-y-2 flex-1">
                  <div className="font-medium text-base text-foreground">{customerName || 'Walk-in Customer'}</div>
                  {a.customer?.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {a.customer.phone}
                    </div>
                  )}
                  {a.customer?.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {a.customer.email}
                    </div>
                  )}
                  {a.customer?.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" /> {a.customer.address}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Vehicle</h3>
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                  <Car className="h-5 w-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="font-medium text-base text-foreground">{vehicleName || 'No vehicle specified'}</div>
                  {a.vehicle?.license_plate && (
                    <div className="text-sm text-muted-foreground font-mono bg-muted inline-block px-2 py-0.5 rounded">
                      {a.vehicle.license_plate}
                    </div>
                  )}
                  {a.vehicle?.vin && (
                    <div className="text-xs text-muted-foreground mt-1 text-balance">
                      VIN: <span className="font-mono">{a.vehicle.vin}</span>
                    </div>
                  )}
                  {a.vehicle?.mileage && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Mileage: {a.vehicle.mileage.toLocaleString()} km
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Service & Notes */}
            <div>
              <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Service Request</h3>
              <div className="space-y-4">
                {a.service_type && (
                  <div>
                    <span className="inline-flex items-center rounded-md border border-border bg-accent/50 px-2.5 py-1 text-sm font-medium text-foreground">
                      {a.service_type}
                    </span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground leading-relaxed p-4 rounded-xl border border-border/50 bg-muted/10 italic">
                  No additional service notes provided. (Placeholder for internal notes)
                </div>
              </div>
            </div>
            
            {/* Tech */}
            <div>
               <h3 className="text-sm font-bold tracking-wider text-muted-foreground uppercase mb-4 border-b border-border/50 pb-2">Assignment</h3>
               <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                   <User className="h-4 w-4" />
                 </div>
                 <div className="text-sm text-foreground">
                   {a.technician?.employee 
                     ? `${a.technician.employee.first_name} ${a.technician.employee.last_name}`
                     : a.technician?.username || 'Unassigned'}
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-card grid grid-cols-2 gap-3">
          <button 
            onClick={() => onEdit(a)}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Edit className="h-4 w-4" /> Edit
          </button>
          
          <button 
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>

          {(a.status === 'booked' || a.status === 'confirmed' || a.status === 'checked_in') && (
            <button 
              onClick={() => handleStatusChange('cancelled')}
              className="col-span-2 flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium rounded-lg text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Cancel Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
