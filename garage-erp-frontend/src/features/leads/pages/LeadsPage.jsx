import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, UserPlus2, Target, CheckCircle2, XCircle, TrendingUp, Clock, Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useLeads, useLeadStats, useMarkLost, useConvertLead } from '@/features/leads/hooks/useLeads';
import { AddLeadModal } from '@/features/leads/components/AddLeadModal';

const DASHBOARD_PATHS = {
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
  supervisor: '/supervisor/dashboard',
  manager: '/manager/dashboard',
  service_advisor: '/dashboard',
  technician: '/technician/dashboard',
  finance: '/finance/dashboard',
  hr: '/hr/dashboard',
  customer: '/customer/dashboard',
  employee: '/dashboard',
};

const STAT_CARDS = [
  { key: 'total_leads', label: 'Total Leads', icon: UserPlus2 },
  { key: 'new_leads_today', label: 'New Today', icon: Target },
  { key: 'qualified_leads', label: 'Qualified', icon: CheckCircle2 },
  { key: 'converted_customers', label: 'Converted', icon: CheckCircle2 },
  { key: 'lost_leads', label: 'Lost', icon: XCircle },
  { key: 'conversion_rate', label: 'Conversion Rate', icon: TrendingUp, suffix: '%' },
  { key: 'pending_followups', label: 'Pending Follow-ups', icon: Clock },
];

const STATUS_META = {
  new: { bg: 'hsl(45 25% 93%)', text: 'hsl(84 15% 30%)' },
  contacted: { bg: 'hsl(200 30% 90%)', text: 'hsl(200 40% 30%)' },
  qualified: { bg: 'hsl(84 25% 30% / 0.15)', text: 'hsl(84 30% 25%)' },
  quotation_sent: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  negotiating: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  converted: { bg: 'hsl(84 20% 89%)', text: 'hsl(84 25% 25%)' },
  lost: { bg: 'hsl(0 30% 95%)', text: 'hsl(0 40% 40%)' },
};

const PRIORITY_META = {
  low: { bg: 'hsl(0 0% 93%)', text: 'hsl(0 0% 40%)' },
  medium: { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  high: { bg: 'hsl(0 50% 92%)', text: 'hsl(0 55% 40%)' },
};

export function LeadsPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: stats } = useLeadStats();
  const { data: leadsData, isLoading } = useLeads({ search, status, priority, page });
  const markLost = useMarkLost();
  const convertLead = useConvertLead();

  const leads = leadsData?.data ?? [];

  async function handleConvert(lead) {
    if (!confirm(`Convert ${lead.name} to a customer?`)) return;
    await convertLead.mutateAsync({ leadId: lead.lead_id });
  }

  async function handleMarkLost(lead) {
    if (!confirm(`Mark ${lead.name} as lost?`)) return;
    await markLost.mutateAsync(lead.lead_id);
  }

  const dashboardPath = DASHBOARD_PATHS[user?.role] ?? '/dashboard';

  const navSections = [
    { label: 'Overview', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
    ] },
    { label: 'Front Desk', items: [
      { label: 'Leads Management', icon: UserPlus2, path: '/leads' },
    ] },
  ];

  return (
    <DashboardLayout navSections={navSections} pageTitle="Leads Management" roleLabel={user?.username ?? 'Staff'}>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link to={dashboardPath} className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          Back to dashboard
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-7 mb-6">
        {STAT_CARDS.map(({ key, label, icon: Icon, suffix }) => (
          <div key={key} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-semibold tracking-tight">
              {stats?.[key] ?? '—'}{suffix && stats?.[key] != null ? suffix : ''}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search leads…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {Object.keys(STATUS_META).map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="">All priorities</option>
          {Object.keys(PRIORITY_META).map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <button onClick={() => setModalOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white" style={{ background: 'hsl(84 25% 30%)' }}>
          <Plus className="h-4 w-4" /> Add lead
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {['ID', 'Name', 'Company', 'Phone', 'Source', 'Service', 'Advisor', 'Status', 'Priority', 'Created', 'Actions'].map((h) => (
                <th key={h} className="px-3 py-2.5 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={11} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={11} className="px-4 py-6 text-center text-muted-foreground">No leads found.</td></tr>
            ) : (
              leads.map((lead) => {
                const statusMeta = STATUS_META[lead.status] ?? STATUS_META.new;
                const priorityMeta = PRIORITY_META[lead.priority] ?? PRIORITY_META.medium;
                const isClosed = lead.status === 'converted' || lead.status === 'lost';
                return (
                  <tr key={lead.lead_id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5 font-mono text-xs">{lead.lead_id}</td>
                    <td className="px-3 py-2.5 font-medium"><Link to={`/leads/${lead.lead_id}`} className="hover:underline">{lead.name}</Link></td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.company ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.phone ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.source ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.interested_service ?? '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.assigned_to ? (lead.assignedTo?.username ?? '—') : 'Unassigned'}</td>
                    <td className="px-3 py-2.5"><span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: statusMeta.bg, color: statusMeta.text }}>{lead.status?.replace('_', ' ')}</span></td>
                    <td className="px-3 py-2.5"><span className="rounded px-2 py-0.5 text-xs font-medium" style={{ background: priorityMeta.bg, color: priorityMeta.text }}>{lead.priority}</span></td>
                    <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        {!isClosed && (
                          <>
                            <button onClick={() => handleConvert(lead)} className="text-xs underline" style={{ color: 'hsl(84 30% 32%)' }}>Convert</button>
                            <button onClick={() => handleMarkLost(lead)} className="text-xs text-muted-foreground hover:text-destructive underline">Lost</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {leadsData && leadsData.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40">Previous</button>
          <span className="text-xs text-muted-foreground">Page {leadsData.current_page} of {leadsData.last_page}</span>
          <button disabled={page >= leadsData.last_page} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-3 py-1.5 text-xs disabled:opacity-40">Next</button>
        </div>
      )}

      <AddLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  );
}