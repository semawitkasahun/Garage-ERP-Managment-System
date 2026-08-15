import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCreateEmployee } from '@/features/employees/hooks/useEmployees';

const JOB_TITLES = ['Technician', 'Service Advisor', 'Supervisor', 'HR', 'Finance', 'Manager', 'Admin', 'Owner'];
const EMPLOYMENT_STATUSES = ['active', 'inactive', 'on_leave', 'terminated'];

export function AddEmployeeModal({ open, onClose }) {
  const { user } = useAuthStore();
  const createEmployee = useCreateEmployee();
  const [form, setForm] = useState({ first_name: '', last_name: '', job_title: '', hire_date: '', phone: '', email: '', employment_status: 'active' });
  const [error, setError] = useState(null);

  if (!open) return null;
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      await createEmployee.mutateAsync({ ...form, branch_id: user?.branch_id });
      onClose();
      setForm({ first_name: '', last_name: '', job_title: '', hire_date: '', phone: '', email: '', employment_status: 'active' });
    } catch (err) {
      setError(err.response?.data?.message ?? 'Could not create employee.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">New employee</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">First name</Label><Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required /></div>
            <div><Label className="text-xs">Last name</Label><Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required /></div>
          </div>
          <div>
            <Label className="text-xs">Job title</Label>
            <select value={form.job_title} onChange={(e) => set('job_title', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Select…</option>
              {JOB_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Hire date</Label><Input type="date" value={form.hire_date} onChange={(e) => set('hire_date', e.target.value)} /></div>
            <div>
              <Label className="text-xs">Status</Label>
              <select value={form.employment_status} onChange={(e) => set('employment_status', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {EMPLOYMENT_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" style={{ background: 'hsl(84 25% 30%)' }} disabled={createEmployee.isPending}>
            {createEmployee.isPending ? 'Creating…' : 'Create employee'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">This creates the HR record only — no system login. Grant access separately from Users & Roles once that's built.</p>
        </form>
      </div>
    </div>
  );
}