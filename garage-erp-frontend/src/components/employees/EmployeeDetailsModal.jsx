import { useState } from 'react';
import { X, Phone, Mail, MapPin, Calendar, Building, User, Shield, CheckCircle, XCircle, FileText, ClipboardCheck, Star } from 'lucide-react';
import { useEmployeeDetail } from '@/features/employees/hooks/useEmployees';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function EmployeeDetailsModal({ employeeId, open, onClose }) {
  const { data: employee, isLoading, error } = useEmployeeDetail(employeeId);

  if (!open) return null;

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const employmentStatusColors = {
    active: { bg: 'hsl(84 20% 89%)', text: 'hsl(84 25% 25%)' },
    inactive: { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)' },
    on_leave: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
    terminated: { bg: 'hsl(0 30% 95%)', text: 'hsl(0 40% 40%)' },
  };

  const statusColor = employmentStatusColors[employee?.employment_status] || employmentStatusColors.active;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight">Employee Details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-destructive">
            Failed to load employee details. Please try again.
          </div>
        ) : employee ? (
          <div className="p-6 space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-lg font-semibold" style={{ background: 'hsl(84 25% 30%)', color: 'white' }}>
                  {getInitials(employee.first_name, employee.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-semibold tracking-tight">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-muted-foreground">{employee.job_title || 'No job title assigned'}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded px-2.5 py-0.5 text-xs font-medium" style={{ background: statusColor.bg, color: statusColor.text }}>
                    {employee.employment_status?.replace('_', ' ') || 'Unknown'}
                  </span>
                  <span className="text-sm text-muted-foreground">ID: {employee.employee_id}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" /> Personal Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm">{employee.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{employee.email || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Address</p>
                      <p className="text-sm">Not provided</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <Building className="h-4 w-4" /> Employment Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employee ID</p>
                      <p className="text-sm font-mono">{employee.employee_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Branch</p>
                      <p className="text-sm">{employee.branch?.name || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Hire Date</p>
                      <p className="text-sm">{employee.hire_date || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employment Status</p>
                      <p className="text-sm capitalize">{employee.employment_status?.replace('_', ' ') || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Account Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="text-sm">{employee.user?.username || 'No account'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {employee.user ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Login Access</p>
                      <p className="text-sm">{employee.user ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned Role</p>
                      <p className="text-sm">{employee.user?.role || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HR Information */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground mb-4 flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> HR Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Attendance Summary</p>
                      <p className="text-sm">
                        {employee.attendance && employee.attendance.length > 0 
                          ? `${employee.attendance.length} records` 
                          : 'No attendance records'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recent Leave Requests</p>
                      <p className="text-sm">
                        {employee.leaveRequests && employee.leaveRequests.length > 0 
                          ? `${employee.leaveRequests.length} requests` 
                          : 'No leave requests'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Performance Evaluations</p>
                      <p className="text-sm">
                        {employee.performanceEvaluations && employee.performanceEvaluations.length > 0 
                          ? `${employee.performanceEvaluations.length} evaluations` 
                          : 'No performance evaluations'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Skills & Certifications</p>
                      <p className="text-sm">
                        {employee.technicianSkills && employee.technicianSkills.length > 0 
                          ? employee.technicianSkills.map(s => s.skill_name || s.name).join(', ') 
                          : 'No skills recorded'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
