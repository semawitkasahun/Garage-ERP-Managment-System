import { useState, useEffect } from 'react';
import { X, DollarSign, Briefcase, Calendar, CheckCircle, ShieldAlert, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import apiClient from '@/services/http/axios';
import { useQueryClient } from '@tanstack/react-query';

export function ConfigurePayrollModal({ open, onClose, employee, onSuccess }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [form, setForm] = useState({
    payment_structure: 'monthly', // 'monthly' | 'weekly'
    salary_structure_id: '',
    basic_salary_override: '',
    effective_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (open && employee) {
      setLoading(true);
      apiClient.get('/salary-structures', { params: { is_active: true, per_page: 100 } })
        .then(({ data }) => {
          const list = data?.data || data || [];
          setSalaryStructures(list);
          if (list.length > 0) {
            setForm(prev => ({
              ...prev,
              salary_structure_id: String(list[0].salary_structure_id),
              payment_structure: list[0].salary_type || list[0].payment_frequency || 'monthly',
              basic_salary_override: list[0].basic_salary ? String(list[0].basic_salary) : '25000',
            }));
          }
        })
        .catch(() => {
          setSalaryStructures([]);
        })
        .finally(() => setLoading(false));

      const empId = employee.id || employee.employee_id;
      if (empId) {
        apiClient.get(`/employee-salary-structures/employee/${empId}/current`)
          .then(({ data }) => {
            if (data) {
              setForm({
                payment_structure: data.salary_structure?.salary_type || data.salary_structure?.payment_frequency || 'monthly',
                salary_structure_id: String(data.salary_structure_id),
                basic_salary_override: data.basic_salary_override || data.salary_structure?.basic_salary || '',
                effective_date: data.effective_date || new Date().toISOString().split('T')[0],
              });
            }
          })
          .catch(() => {});
      }
    }
  }, [open, employee]);

  if (!open || !employee) return null;

  const empName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee';
  const empIdStr = `EMP-${String(employee.id || employee.employee_id || 1).padStart(3, '0')}`;
  const empJob = employee.job_title || 'Staff';

  const filteredStructures = salaryStructures.filter(s => 
    (s.salary_type || s.payment_frequency || 'monthly') === form.payment_structure
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const empId = employee.id || employee.employee_id;
    if (!empId) {
      toast.error('Invalid employee selection');
      return;
    }

    setSubmitting(true);
    try {
      let structId = form.salary_structure_id;
      const matched = salaryStructures.find(s => String(s.salary_structure_id) === String(structId));

      // If structure doesn't match selected type or none selected, find or create one
      if (!matched || (matched.salary_type || matched.payment_frequency) !== form.payment_structure) {
        const found = filteredStructures[0];
        if (found) {
          structId = found.salary_structure_id;
        } else {
          // Auto-create salary structure for selected structure (Monthly vs Weekly)
          const isWeekly = form.payment_structure === 'weekly';
          const structRes = await apiClient.post('/salary-structures', {
            branch_id: employee.branch_id || employee.branch?.branch_id || 1,
            department_id: employee.department_id || employee.department?.department_id || null,
            name: isWeekly ? 'Standard Weekly Salary Structure' : 'Standard Monthly Salary Structure',
            code: isWeekly ? `WEEKLY-${Date.now().toString().slice(-5)}` : `MONTHLY-${Date.now().toString().slice(-5)}`,
            basic_salary: form.basic_salary_override ? parseFloat(form.basic_salary_override) : (isWeekly ? 6250 : 25000),
            salary_type: form.payment_structure,
            payment_frequency: form.payment_structure,
            working_days_per_month: isWeekly ? 5 : 22,
            working_hours_per_day: 8,
            overtime_rate: 100,
            is_active: true,
          });
          structId = structRes.data?.salary_structure_id;
        }
      }

      await apiClient.post('/employee-salary-structures', {
        employee_id: empId,
        salary_structure_id: parseInt(structId),
        basic_salary_override: form.basic_salary_override ? parseFloat(form.basic_salary_override) : null,
        effective_date: form.effective_date,
        is_active: true,
      });

      toast.success(`Payroll setup configured as ${form.payment_structure.toUpperCase()} for ${empName}`);
      queryClient.invalidateQueries(['employeePayrollList']);
      queryClient.invalidateQueries(['employeePayrollDetail', empId]);
      queryClient.invalidateQueries(['employees']);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to configure employee payroll setup');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl bg-card border border-border"
        style={{ animation: 'cfgFadeIn 0.2s ease-out' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'hsl(84 20% 89%)' }}>
              <DollarSign className="h-5 w-5" style={{ color: 'hsl(84 25% 30%)' }} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Configure Payroll Setup</h3>
              <p className="text-xs text-muted-foreground">{empName} ({empIdStr})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-md hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Employee Brief Card */}
        <div className="px-6 py-3 bg-accent/20 border-b border-border flex items-center justify-between text-xs">
          <div>
            <span className="text-muted-foreground">Position: </span>
            <span className="font-medium text-foreground">{empJob}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Status: </span>
            <span className="font-medium text-foreground capitalize">{employee.status || employee.employment_status || 'active'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Payment Structure Selection (Monthly vs Weekly) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
              Payment Structure *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm(f => ({ ...f, payment_structure: 'monthly' }));
                  if (form.basic_salary_override === '6250') setForm(f => ({ ...f, basic_salary_override: '25000' }));
                }}
                className={`p-3 rounded-lg border text-left transition-all ${form.payment_structure === 'monthly' ? 'ring-2 border-transparent' : 'hover:bg-accent/20'}`}
                style={{
                  borderColor: form.payment_structure === 'monthly' ? 'hsl(84 25% 30%)' : 'var(--border)',
                  background: form.payment_structure === 'monthly' ? 'hsl(84 20% 93%)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-foreground">Monthly</span>
                  {form.payment_structure === 'monthly' && <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 30%)' }} />}
                </div>
                <p className="text-[11px] text-muted-foreground">Monthly basic salary payment cycle</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(f => ({ ...f, payment_structure: 'weekly' }));
                  if (form.basic_salary_override === '25000') setForm(f => ({ ...f, basic_salary_override: '6250' }));
                }}
                className={`p-3 rounded-lg border text-left transition-all ${form.payment_structure === 'weekly' ? 'ring-2 border-transparent' : 'hover:bg-accent/20'}`}
                style={{
                  borderColor: form.payment_structure === 'weekly' ? 'hsl(84 25% 30%)' : 'var(--border)',
                  background: form.payment_structure === 'weekly' ? 'hsl(84 20% 93%)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-foreground">Weekly</span>
                  {form.payment_structure === 'weekly' && <CheckCircle className="h-3.5 w-3.5" style={{ color: 'hsl(84 25% 30%)' }} />}
                </div>
                <p className="text-[11px] text-muted-foreground">Weekly basic salary payment cycle</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Basic Salary (ETB / {form.payment_structure === 'weekly' ? 'Week' : 'Month'}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder={form.payment_structure === 'weekly' ? 'e.g. 6250' : 'e.g. 25000'}
              value={form.basic_salary_override}
              onChange={(e) => setForm(f => ({ ...f, basic_salary_override: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Salary Structure Preset
            </label>
            {filteredStructures.length > 0 ? (
              <select
                value={form.salary_structure_id}
                onChange={(e) => setForm(f => ({ ...f, salary_structure_id: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              >
                {filteredStructures.map(s => (
                  <option key={s.salary_structure_id} value={s.salary_structure_id}>
                    {s.name} ({s.basic_salary ? `ETB ${Number(s.basic_salary).toLocaleString()}` : 'Standard'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                <span>A standard {form.payment_structure} salary structure will be created automatically.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Effective Date *
            </label>
            <input
              type="date"
              value={form.effective_date}
              onChange={(e) => setForm(f => ({ ...f, effective_date: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent/30 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || loading}
              className="px-5 py-2 text-sm font-medium text-white rounded-md transition-colors hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              {submitting ? 'Saving...' : 'Save Setup'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes cfgFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
