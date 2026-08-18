import { useState, useEffect } from 'react';
import { X, User, DollarSign, Briefcase, Calendar, CheckCircle, ShieldAlert, Clock } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUpdateEmployee } from '@/features/employees/hooks/useEmployees';
import { useToast } from '@/components/ui/Toast';
import { useSalaryStructures } from '@/features/payroll/hooks/usePayroll';
import apiClient from '@/services/http/axios';
import { useQueryClient } from '@tanstack/react-query';

const JOB_TITLES = [
  'Technician', 'Senior Technician', 'Lead Technician',
  'Service Advisor', 'Supervisor', 'HR', 'Finance',
  'Manager', 'Branch Manager', 'Admin', 'Owner', 'Other',
];
const EMPLOYMENT_STATUSES = ['active', 'inactive', 'on_leave', 'terminated'];
const STEPS = [
  { id: 'personal', label: 'Personal & Job Info', icon: User },
  { id: 'salary', label: 'Salary Setup', icon: DollarSign },
];

export function EditEmployeeModal({ open, onClose, employee }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const updateEmployee = useUpdateEmployee();
  const { data: salaryStructuresData } = useSalaryStructures({ is_active: true, per_page: 50 });

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSalary, setLoadingSalary] = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', job_title: '',
    hire_date: '', phone: '', email: '', employment_status: 'active',
  });
  const [salary, setSalary] = useState({
    payment_structure: 'monthly', // 'monthly' | 'weekly'
    salary_structure_id: '',
    basic_salary_override: '',
    effective_date: new Date().toISOString().split('T')[0],
  });

  const salaryStructures = salaryStructuresData?.data ?? (Array.isArray(salaryStructuresData) ? salaryStructuresData : []);

  useEffect(() => {
    if (open && employee) {
      setStep(0);
      setForm({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        job_title: employee.job_title || 'Technician',
        hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
        phone: employee.phone || '',
        email: employee.email || '',
        employment_status: employee.employment_status || 'active',
      });

      const empId = employee.employee_id || employee.id;
      const existingSalary = employee.current_salary_structure?.basic_salary_override || employee.current_salary_structure?.salary_structure?.basic_salary;
      const existingStructId = employee.current_salary_structure?.salary_structure_id;
      const existingType = employee.current_salary_structure?.salary_structure?.salary_type || employee.current_salary_structure?.salary_structure?.payment_frequency || 'monthly';

      if (existingSalary) {
        setSalary({
          payment_structure: existingType,
          salary_structure_id: existingStructId ? String(existingStructId) : '',
          basic_salary_override: String(existingSalary),
          effective_date: new Date().toISOString().split('T')[0],
        });
      }

      setLoadingSalary(true);
      apiClient.get(`/employee-salary-structures/employee/${empId}/current`)
        .then(({ data }) => {
          if (data) {
            setSalary({
              payment_structure: data.salary_structure?.salary_type || data.salary_structure?.payment_frequency || 'monthly',
              salary_structure_id: String(data.salary_structure_id),
              basic_salary_override: data.basic_salary_override ? String(data.basic_salary_override) : (data.salary_structure?.basic_salary ? String(data.salary_structure.basic_salary) : ''),
              effective_date: data.effective_date || new Date().toISOString().split('T')[0],
            });
          }
        })
        .catch(() => {})
        .finally(() => setLoadingSalary(false));
    }
  }, [open, employee]);

  if (!open || !employee) return null;

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const setSal = (field, value) => setSalary(s => ({ ...s, [field]: value }));

  const validateStep0 = () => {
    if (!form.first_name.trim()) { toast.error('First name is required'); return false; }
    if (!form.last_name.trim()) { toast.error('Last name is required'); return false; }
    if (!form.job_title) { toast.error('Job title is required'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    setStep(s => s + 1);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (step < STEPS.length - 1) { handleNext(); return; }

    const empId = employee.employee_id || employee.id;
    setIsSubmitting(true);

    try {
      await updateEmployee.mutateAsync({
        employeeId: empId,
        payload: form,
      });

      if (salary.basic_salary_override) {
        let structId = salary.salary_structure_id;
        const isWeekly = salary.payment_structure === 'weekly';

        if (!structId) {
          const structRes = await apiClient.post('/salary-structures', {
            branch_id: employee.branch_id || 1,
            name: isWeekly ? 'Standard Weekly Structure' : 'Standard Monthly Structure',
            code: isWeekly ? `WEEK-${Date.now().toString().slice(-5)}` : `MONTH-${Date.now().toString().slice(-5)}`,
            basic_salary: parseFloat(salary.basic_salary_override) || (isWeekly ? 6250 : 25000),
            salary_type: salary.payment_structure,
            payment_frequency: salary.payment_structure,
            working_days_per_month: isWeekly ? 5 : 22,
            working_hours_per_day: 8,
            overtime_rate: 100,
            is_active: true,
          });
          structId = structRes.data?.salary_structure_id;
        }

        await apiClient.post('/employee-salary-structures', {
          employee_id: empId,
          salary_structure_id: parseInt(structId),
          basic_salary_override: parseFloat(salary.basic_salary_override),
          effective_date: salary.effective_date,
          is_active: true,
        });
      }

      queryClient.invalidateQueries(['employees']);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['employee-stats']);
      queryClient.invalidateQueries(['employee', empId]);
      queryClient.invalidateQueries(['employeePayrollDetail', empId]);

      toast.success(`${form.first_name} ${form.last_name} updated with ${salary.payment_structure.toUpperCase()} salary setup`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not update employee details.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl bg-card border border-border"
        style={{ animation: 'empModalSlide 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'hsl(84 20% 89%)' }}>
              <User className="h-5 w-5" style={{ color: 'hsl(84 25% 30%)' }} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold">Edit Employee Profile</h2>
              <p className="text-xs text-muted-foreground">{employee.first_name} {employee.last_name} (EMP-{String(employee.employee_id || employee.id).padStart(3, '0')})</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-md hover:bg-accent/50 transition-colors disabled:opacity-50">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center px-6 py-3 border-b border-border bg-accent/20">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                    style={{
                      background: isDone ? 'hsl(145 55% 38%)' : isCurrent ? 'hsl(84 25% 30%)' : 'hsl(0 0% 90%)',
                      color: isDone || isCurrent ? 'white' : 'hsl(0 0% 50%)',
                    }}
                  >
                    {isDone ? <CheckCircle className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3" style={{ background: isDone ? 'hsl(145 55% 38%)' : 'hsl(0 0% 88%)' }} />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Step 0: Personal Info */}
            {step === 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">First Name *</Label>
                    <Input value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Last Name *</Label>
                    <Input value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1.5 block">Job Title / Position *</Label>
                  <select
                    value={form.job_title}
                    onChange={e => set('job_title', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 font-medium"
                    required
                  >
                    {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Phone Number</Label>
                    <Input value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Email Address</Label>
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Hire Date *</Label>
                    <Input type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} required />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Employment Status</Label>
                    <select
                      value={form.employment_status}
                      onChange={e => set('employment_status', e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                    >
                      {EMPLOYMENT_STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Step 1: Salary Setup */}
            {step === 1 && (
              <>
                <div className="p-3.5 rounded-lg border border-border bg-accent/20 text-xs space-y-1">
                  <p className="font-semibold text-foreground">Salary Configuration for {form.first_name} {form.last_name}</p>
                  <p className="text-muted-foreground">Select payment structure (Monthly vs Weekly) and update basic salary.</p>
                </div>

                <div>
                  <Label className="text-xs mb-2 block font-mono uppercase tracking-wider text-muted-foreground">
                    Payment Structure *
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSal('payment_structure', 'monthly')}
                      className={`p-3 rounded-lg border text-left transition-all ${salary.payment_structure === 'monthly' ? 'ring-2 border-transparent' : 'hover:bg-accent/20'}`}
                      style={{
                        borderColor: salary.payment_structure === 'monthly' ? 'hsl(84 25% 30%)' : 'var(--border)',
                        background: salary.payment_structure === 'monthly' ? 'hsl(84 20% 93%)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-foreground">Monthly</span>
                        {salary.payment_structure === 'monthly' && <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 30%)' }} />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Monthly salary cycle</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSal('payment_structure', 'weekly')}
                      className={`p-3 rounded-lg border text-left transition-all ${salary.payment_structure === 'weekly' ? 'ring-2 border-transparent' : 'hover:bg-accent/20'}`}
                      style={{
                        borderColor: salary.payment_structure === 'weekly' ? 'hsl(84 25% 30%)' : 'var(--border)',
                        background: salary.payment_structure === 'weekly' ? 'hsl(84 20% 93%)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-foreground">Weekly</span>
                        {salary.payment_structure === 'weekly' && <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 30%)' }} />}
                      </div>
                      <p className="text-[11px] text-muted-foreground">Weekly salary cycle</p>
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-1.5 block">Basic Salary (ETB / {salary.payment_structure === 'weekly' ? 'Week' : 'Month'}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salary.basic_salary_override}
                    onChange={e => setSal('basic_salary_override', e.target.value)}
                    placeholder={salary.payment_structure === 'weekly' ? 'e.g. 6250' : 'e.g. 25000'}
                    className="font-bold text-base"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs mb-1.5 block">Effective Date *</Label>
                  <Input
                    type="date"
                    value={salary.effective_date}
                    onChange={e => setSal('effective_date', e.target.value)}
                    required
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-accent/10">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent/30 transition-colors"
              >
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent/30 transition-colors"
              >
                Cancel
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                Next: Salary Setup →
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
                style={{ background: 'hsl(84 25% 30%)' }}
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        @keyframes empModalSlide { from { opacity: 0; transform: scale(0.97) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
