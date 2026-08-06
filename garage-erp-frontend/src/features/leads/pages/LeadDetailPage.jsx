import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus2, Phone, Mail, Building2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLead, useUpdateLead, useMarkLost, useAddFollowup, useConvertLead } from '@/features/leads/hooks/useLeads';

const TABS = ['Overview', 'Vehicle', 'Follow-ups', 'Timeline'];
const STATUSES = ['new', 'contacted', 'qualified', 'quotation_sent', 'negotiating', 'converted', 'lost'];
const FOLLOWUP_METHODS = ['phone', 'sms', 'whatsapp', 'email', 'in_person'];

export function LeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [tab, setTab] = useState('Overview');

  const { data: lead, isLoading } = useLead(leadId);
  const updateLead = useUpdateLead();
  const markLost = useMarkLost();
  const addFollowup = useAddFollowup();
  const convertLead = useConvertLead();

  const navSections = [{ label: 'Front Desk', items: [{ label: 'Leads Management', icon: UserPlus2, path: '/leads' }] }];

  if (isLoading || !lead) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Lead" roleLabel={user?.username ?? 'Staff'}>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </DashboardLayout>
    );
  }

  async function handleConvert() {
    if (!confirm(`Convert ${lead.name} to a customer?`)) return;
    const res = await convertLead.mutateAsync({ leadId });
    if (res.customer) alert(`Converted. New customer ID: ${res.customer.customer_id}`);
  }

  async function handleMarkLost() {
    if (!confirm(`Mark ${lead.name} as lost?`)) return;
    await markLost.mutateAsync(leadId);
  }

  const isClosed = lead.status === 'converted' || lead.status === 'lost';

  const dashboardPath = user?.role === 'admin'
    ? '/admin/dashboard'
    : user?.role === 'owner'
      ? '/owner/dashboard'
      : user?.role === 'technician'
        ? '/technician/dashboard'
        : user?.role === 'finance'
          ? '/finance/dashboard'
          : user?.role === 'hr'
            ? '/hr/dashboard'
            : '/dashboard';

  return (
    <DashboardLayout navSections={navSections} pageTitle={lead.name} roleLabel={user?.username ?? 'Staff'}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link to={dashboardPath} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Back to dashboard
        </Link>
        <button onClick={() => navigate('/leads')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to leads
        </button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{lead.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>}
            {lead.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
            {lead.company && <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{lead.company}</span>}
          </div>
        </div>
        {!isClosed && (
          <div className="flex gap-2">
            <Button onClick={handleConvert} style={{ background: 'hsl(84 25% 30%)' }} disabled={convertLead.isPending}>
              {convertLead.isPending ? 'Converting…' : 'Convert to customer'}
            </Button>
            <button onClick={handleMarkLost} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">Mark as lost</button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-border mb-5">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
            style={tab === t ? { borderColor: 'hsl(84 25% 30%)', color: 'hsl(84 25% 25%)' } : { borderColor: 'transparent', color: 'hsl(90 8% 45%)' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab lead={lead} onSave={(payload) => updateLead.mutateAsync({ leadId, payload })} />}
      {tab === 'Vehicle' && <VehicleTab lead={lead} onSave={(payload) => updateLead.mutateAsync({ leadId, payload })} />}
      {tab === 'Follow-ups' && <FollowupsTab lead={lead} onAdd={(payload) => addFollowup.mutateAsync({ leadId, payload })} isPending={addFollowup.isPending} />}
      {tab === 'Timeline' && <TimelineTab lead={lead} />}
    </DashboardLayout>
  );
}

function OverviewTab({ lead, onSave }) {
  const [form, setForm] = useState({
    status: lead.status ?? 'new', priority: lead.priority ?? 'medium',
    interested_service: lead.interested_service ?? '', expected_budget: lead.expected_budget ?? '',
    preferred_contact_method: lead.preferred_contact_method ?? '', interest_level: lead.interest_level ?? '',
    urgency: lead.urgency ?? '', is_decision_maker: lead.is_decision_maker ?? false,
    expected_service_date: lead.expected_service_date ?? '', notes: lead.notes ?? '',
  });
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="max-w-2xl space-y-5">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Qualification & status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Status</Label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Priority</Label>
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {['low', 'medium', 'high'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Interest level</Label>
            <select value={form.interest_level} onChange={(e) => set('interest_level', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">—</option>{['low', 'medium', 'high'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Urgency</Label>
            <select value={form.urgency} onChange={(e) => set('urgency', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">—</option>{['immediate', 'this_week', 'this_month', 'exploring'].map((u) => <option key={u} value={u}>{u.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><Label className="text-xs">Expected budget</Label><Input type="number" value={form.expected_budget ?? ''} onChange={(e) => set('expected_budget', e.target.value)} /></div>
          <div><Label className="text-xs">Expected service date</Label><Input type="date" value={form.expected_service_date ?? ''} onChange={(e) => set('expected_service_date', e.target.value)} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm mt-4">
          <input type="checkbox" checked={!!form.is_decision_maker} onChange={(e) => set('is_decision_maker', e.target.checked)} />
          Contact is the decision maker
        </label>
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Notes</h2>
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
      </div>
      <Button type="submit" style={{ background: 'hsl(84 25% 30%)' }}><Save className="h-4 w-4 mr-1.5 inline" /> Save changes</Button>
    </form>
  );
}

function VehicleTab({ lead, onSave }) {
  const [form, setForm] = useState({
    vehicle_make: lead.vehicle_make ?? '', vehicle_model: lead.vehicle_model ?? '',
    vehicle_year: lead.vehicle_year ?? '', vehicle_plate: lead.vehicle_plate ?? '', vehicle_vin: lead.vehicle_vin ?? '',
  });
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-sm font-semibold tracking-tight mb-1">Vehicle of interest</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="text-xs">Make</Label><Input value={form.vehicle_make} onChange={(e) => set('vehicle_make', e.target.value)} /></div>
        <div><Label className="text-xs">Model</Label><Input value={form.vehicle_model} onChange={(e) => set('vehicle_model', e.target.value)} /></div>
        <div><Label className="text-xs">Year</Label><Input type="number" value={form.vehicle_year} onChange={(e) => set('vehicle_year', e.target.value)} /></div>
        <div><Label className="text-xs">Plate (optional)</Label><Input value={form.vehicle_plate} onChange={(e) => set('vehicle_plate', e.target.value)} /></div>
        <div className="col-span-2"><Label className="text-xs">VIN (optional)</Label><Input value={form.vehicle_vin} onChange={(e) => set('vehicle_vin', e.target.value)} /></div>
      </div>
      <Button type="submit" style={{ background: 'hsl(84 25% 30%)' }}>Save</Button>
    </form>
  );
}

function FollowupsTab({ lead, onAdd, isPending }) {
  const [form, setForm] = useState({ scheduled_at: '', method: 'phone', notes: '', next_followup_date: '' });
  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    await onAdd(form);
    setForm({ scheduled_at: '', method: 'phone', notes: '', next_followup_date: '' });
  }

  return (
    <div className="max-w-2xl space-y-5">
      <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-1">Log a follow-up</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Date & time</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => set('scheduled_at', e.target.value)} required /></div>
          <div>
            <Label className="text-xs">Method</Label>
            <select value={form.method} onChange={(e) => set('method', e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {FOLLOWUP_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div><Label className="text-xs">Notes</Label><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
        <div><Label className="text-xs">Next follow-up date</Label><Input type="date" value={form.next_followup_date} onChange={(e) => set('next_followup_date', e.target.value)} /></div>
        <Button type="submit" style={{ background: 'hsl(84 25% 30%)' }} disabled={isPending}>{isPending ? 'Saving…' : 'Add follow-up'}</Button>
      </form>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">History</h2>
        {!lead.followups?.length ? (
          <p className="text-sm text-muted-foreground">No follow-ups logged yet.</p>
        ) : (
          <div className="space-y-3">
            {lead.followups.map((f) => (
              <div key={f.followup_id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{new Date(f.scheduled_at).toLocaleString()} · {f.method.replace('_', ' ')}</span>
                  <span className="text-xs text-muted-foreground">{f.createdBy?.username ?? ''}</span>
                </div>
                {f.notes && <p className="text-sm text-muted-foreground mt-1">{f.notes}</p>}
                {f.next_followup_date && <p className="text-xs text-muted-foreground mt-1">Next: {f.next_followup_date}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineTab({ lead }) {
  const events = [
    { label: 'Lead created', at: lead.created_at },
    ...(lead.followups ?? []).map((f) => ({ label: `Follow-up (${f.method.replace('_', ' ')})`, at: f.scheduled_at, notes: f.notes })),
    ...(lead.status === 'converted' ? [{ label: 'Converted to customer', at: lead.updated_at }] : []),
    ...(lead.status === 'lost' ? [{ label: 'Marked as lost', at: lead.updated_at }] : []),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <div className="max-w-2xl rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Activity timeline</h2>
      <div className="space-y-4">
        {events.map((e, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2 w-2 rounded-full mt-1.5" style={{ background: 'hsl(84 25% 30%)' }} />
              {i < events.length - 1 && <div className="w-px flex-1" style={{ background: 'hsl(45 15% 87%)' }} />}
            </div>
            <div className="pb-4">
              <p className="text-sm font-medium">{e.label}</p>
              <p className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</p>
              {e.notes && <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}