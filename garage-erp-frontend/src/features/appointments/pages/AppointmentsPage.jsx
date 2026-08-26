import React, { useState, useMemo, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays,
  Calendar, LayoutGrid, Search, Filter, ExternalLink,
  ChevronUp, ChevronDown, ChevronsUpDown, Clock, MoreHorizontal, LayoutDashboard,
  User, Car, Wrench, MapPin, AlertTriangle, CheckCircle2,
  XCircle, CircleDot, Ban,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getNavSections } from '@/layouts/navSections';
import {
  useAppointments,
  useAppointmentsRange,
  useBays,
  useTechnicians,
  useUpdateAppointmentStatus,
} from '@/features/appointments/hooks/useAppointments';
import { NewAppointmentModal } from '@/features/appointments/components/NewAppointmentModal';
import { AppointmentDrawer } from '@/features/appointments/components/AppointmentDrawer';

// ─── RowActions Component ───────────────────────────────────────────────────
function RowActions({ appointment, onAction }) {
  const [open, setOpen] = useState(false);

  // Close when clicking outside
  React.useEffect(() => {
    const handleDocumentClick = () => setOpen(false);
    if (open) document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button 
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      
      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-lg border border-border bg-popover shadow-md py-1 z-10 text-sm text-popover-foreground">
          <button 
            className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onAction('view', appointment); }}
          >
            View Details
          </button>
          <button 
            className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onAction('edit', appointment); }}
          >
            Edit
          </button>
          <button 
            className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onAction('reschedule', appointment); }}
          >
            Reschedule
          </button>
          
          {(appointment.status === 'booked' || appointment.status === 'confirmed') && (
            <button 
              className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction('check_in', appointment); }}
            >
              Check In
            </button>
          )}

          {(appointment.status === 'booked' || appointment.status === 'confirmed' || appointment.status === 'checked_in') && (
            <button 
              className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-accent-foreground text-red-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onAction('cancel', appointment); }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

const STATUS_META = {
  booked:      { bg:'hsl(38 90% 94%)',  border:'hsl(38 75% 62%)',  text:'hsl(38 55% 28%)',  dot:'hsl(38 75% 52%)',  label:'Booked',      Icon: CircleDot   },
  confirmed:   { bg:'hsl(142 55% 93%)', border:'hsl(142 48% 55%)', text:'hsl(142 45% 22%)', dot:'hsl(142 50% 40%)', label:'Confirmed',   Icon: CheckCircle2 },
  checked_in:  { bg:'hsl(210 80% 95%)', border:'hsl(210 60% 65%)', text:'hsl(210 70% 30%)', dot:'hsl(210 60% 50%)', label:'Checked-In',  Icon: CircleDot   },
  in_progress: { bg:'hsl(280 70% 95%)', border:'hsl(280 50% 65%)', text:'hsl(280 60% 30%)', dot:'hsl(280 50% 50%)', label:'In Progress', Icon: Clock       },
  completed:   { bg:'hsl(84 28% 92%)',  border:'hsl(84 25% 55%)',  text:'hsl(84 25% 22%)',  dot:'hsl(84 30% 38%)',  label:'Completed',   Icon: CheckCircle2 },
  cancelled:   { bg:'hsl(0 70% 96%)',   border:'hsl(0 52% 68%)',   text:'hsl(0 52% 35%)',   dot:'hsl(0 58% 50%)',   label:'Cancelled',   Icon: XCircle     },
  no_show:     { bg:'hsl(220 14% 94%)', border:'hsl(220 12% 70%)', text:'hsl(220 12% 38%)', dot:'hsl(220 12% 55%)', label:'No Show',     Icon: Ban         },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDateStr(d) { return d.toISOString().slice(0, 10); }
function addDays(s, n) { const d = new Date(s); d.setDate(d.getDate() + n); return toDateStr(d); }

function getWeekStart(s) { const d = new Date(s); d.setDate(d.getDate() - d.getDay()); return toDateStr(d); }
function getWeekEnd(s)   { return addDays(getWeekStart(s), 6); }

function getMonthBounds(s) {
  const d = new Date(s);
  const start = toDateStr(new Date(d.getFullYear(), d.getMonth(), 1));
  const end   = toDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { start, end };
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function formatDateTime(iso) { return `${formatDate(iso)} ${formatTime(iso)}`; }

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.booked;
  const { Icon } = meta;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.text }}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

// ─── StatusSelect ─────────────────────────────────────────────────────────────
function StatusSelect({ apptId, current, onChange }) {
  return (
    <select
      value={current}
      onChange={(e) => onChange(apptId, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer transition-all hover:shadow-sm"
      style={{
        background: STATUS_META[current]?.bg,
        borderColor: STATUS_META[current]?.border,
        color: STATUS_META[current]?.text,
      }}
    >
      {Object.entries(STATUS_META).map(([s, m]) => (
        <option key={s} value={s}>{m.label}</option>
      ))}
    </select>
  );
}

// ─── SortIcon ─────────────────────────────────────────────────────────────────
function SortIcon({ field, sort }) {
  if (sort.field !== field) return <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />;
  return sort.dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5" style={{ color: 'hsl(84 30% 40%)' }} />
    : <ChevronDown className="h-3.5 w-3.5" style={{ color: 'hsl(84 30% 40%)' }} />;
}

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
  technician: '/technician/dashboard',
  customer: '/customer/dashboard',
  supervisor: '/hr/dashboard',
  hr: '/hr/dashboard',
  finance: '/finance/dashboard',
  manager: '/manager/dashboard',
  employee: '/dashboard',
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AppointmentsPage() {
  const { user, role }  = useAuthStore();
  const branchId  = user?.branch_id;
  const todayStr  = toDateStr(new Date());
  const dashboardPath = DASHBOARD_BY_ROLE[role] ?? '/dashboard';

  const navSections = getNavSections(role);

  // ─ View / date state ─
  const [view,        setView]        = useState('day');
  const [currentDate, setCurrentDate] = useState(todayStr);
  const [search,      setSearch]      = useState('');
  const [filterStatus,setFilterStatus]= useState('');
  const [filterBay,   setFilterBay]   = useState('');
  const [filterTech,  setFilterTech]  = useState('');
  const [sort,        setSort]        = useState({ field: 'scheduled_start', dir: 'asc' });
  const [modal,       setModal]       = useState({ open: false, defaults: {}, editData: null });
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ─ Data ─
  const { data: bays }       = useBays(branchId);
  const { data: technicians }= useTechnicians(branchId);
  const updateStatus         = useUpdateAppointmentStatus();

  const weekStart   = getWeekStart(currentDate);
  const weekEnd     = getWeekEnd(currentDate);
  const { start: mStart, end: mEnd } = getMonthBounds(currentDate);

  const singleDay = useAppointments({ date: currentDate, branchId });
  const rangeQ    = useAppointmentsRange({
    startDate: view === 'week' ? weekStart : mStart,
    endDate:   view === 'week' ? weekEnd   : mEnd,
    branchId,
  });

  const rawAppointments = view === 'day'
    ? (singleDay.data ?? [])
    : (rangeQ.data ?? []);

  const isLoading = view === 'day' ? singleDay.isLoading : rangeQ.isLoading;

  // ─ Filter + sort ─
  const appointments = useMemo(() => {
    let list = [...rawAppointments];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const cname = a.customer
          ? `${a.customer.first_name ?? ''} ${a.customer.last_name ?? ''}`.trim().toLowerCase()
          : (a.customer_name ?? '').toLowerCase();
        const vname = a.vehicle
          ? `${a.vehicle.year ?? ''} ${a.vehicle.make ?? ''} ${a.vehicle.model ?? ''}`.trim().toLowerCase()
          : (a.vehicle_name ?? '').toLowerCase();
        const stype = (a.service_type ?? '').toLowerCase();
        const tname = a.technician?.employee
          ? `${a.technician.employee.first_name ?? ''} ${a.technician.employee.last_name ?? ''}`.trim().toLowerCase()
          : (a.technician?.username ?? '').toLowerCase();
        return cname.includes(q) || vname.includes(q) || stype.includes(q) || tname.includes(q);
      });
    }
    if (filterStatus) list = list.filter(a => a.status === filterStatus);
    if (filterBay)    list = list.filter(a => String(a.bay_id) === filterBay);
    if (filterTech)   list = list.filter(a => String(a.technician_id) === filterTech);

    list.sort((a, b) => {
      let va = a[sort.field] ?? '';
      let vb = b[sort.field] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1  : -1;
      return 0;
    });

    return list;
  }, [rawAppointments, search, filterStatus, filterBay, filterTech, sort]);

  // ─ Navigation ─
  function navigate(delta) {
    if (view === 'day')   setCurrentDate(addDays(currentDate, delta));
    if (view === 'week')  setCurrentDate(addDays(currentDate, delta * 7));
    if (view === 'month') {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + delta);
      setCurrentDate(toDateStr(d));
    }
  }

  function formatHeader() {
    const d = new Date(currentDate);
    if (view === 'day')   return d.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    if (view === 'week')  {
      const s = new Date(weekStart), e = new Date(weekEnd);
      return `${s.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${e.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`;
    }
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  function toggleSort(field) {
    setSort(s => s.field === field
      ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' }
    );
  }

  function customerName(a) {
    return a.customer?.first_name
      ? `${a.customer.first_name} ${a.customer.last_name ?? ''}`.trim()
      : (a.customer_name ?? `#${a.customer_id}`);
  }
  function vehicleName(a) {
    return a.vehicle
      ? `${a.vehicle.year ?? ''} ${a.vehicle.make ?? ''} ${a.vehicle.model ?? ''}`.trim()
      : (a.vehicle_name ?? '—');
  }
  function techName(a) {
    if (!a.technician) return '—';
    const emp = a.technician.employee;
    return emp ? `${emp.first_name} ${emp.last_name}`.trim() : (a.technician.username ?? '—');
  }

  function handleRowAction(action, appointment) {
    switch(action) {
      case 'view':
        setSelectedAppointment(appointment);
        break;
      case 'edit':
      case 'reschedule':
        setModal({ open: true, defaults: {}, editData: appointment });
        break;
      case 'check_in':
        updateStatus.mutate({ appointmentId: appointment.appointment_id, status: 'checked_in' });
        break;
      case 'cancel':
        updateStatus.mutate({ appointmentId: appointment.appointment_id, status: 'cancelled' });
        break;
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout navSections={navSections} pageTitle="Appointments" roleLabel={user?.username ?? 'Staff'}>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl mb-5 px-4 py-3 flex flex-wrap items-center gap-3 border border-border shadow-sm"
        style={{ background: 'linear-gradient(135deg, hsl(90 14% 8%) 0%, hsl(84 12% 12%) 100%)' }}
      >
        {/* Date nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ background:'hsl(84 10% 15%)', border:'1px solid hsl(84 12% 22%)', color:'hsl(84 10% 65%)' }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCurrentDate(todayStr)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background:'hsl(84 10% 16%)', color:'hsl(84 15% 60%)', border:'1px solid hsl(84 12% 22%)' }}
          >
            Today
          </button>
          <button
            onClick={() => navigate(1)}
            className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ background:'hsl(84 10% 15%)', border:'1px solid hsl(84 12% 22%)', color:'hsl(84 10% 65%)' }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs border outline-none"
            style={{ background:'hsl(84 10% 14%)', color:'hsl(45 30% 90%)', borderColor:'hsl(84 12% 22%)' }}
          />
        </div>

        {/* Period label */}
        <span className="hidden sm:block font-display text-sm font-semibold flex-1 truncate" style={{ color:'hsl(45 30% 92%)' }}>
          {formatHeader()}
        </span>

        {/* View switcher */}
        <div className="flex rounded-lg p-0.5" style={{ background:'hsl(84 10% 14%)', border:'1px solid hsl(84 12% 20%)' }}>
          {[
            { id:'day',   label:'Day',   Icon: CalendarDays },
            { id:'week',  label:'Week',  Icon: Calendar     },
            { id:'month', label:'Month', Icon: LayoutGrid   },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={view === id
                ? { background:'hsl(84 25% 30%)', color:'white' }
                : { color:'hsl(84 10% 55%)' }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* New Appointment */}
        <Link
          to="/appointments/new"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ background:'hsl(84 25% 30%)' }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Appointment</span>
          <span className="sm:hidden">New</span>
        </Link>
        <Link to="/appointments/new" title="Full booking form"
          className="flex items-center gap-1 text-xs transition-colors" style={{ color:'hsl(84 15% 50%)' }}>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Filters row ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customer, vehicle, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_META).map(([s, m]) => <option key={s} value={s}>{m.label}</option>)}
        </select>

        {/* Bay filter */}
        {bays?.length > 0 && (
          <select
            value={filterBay}
            onChange={(e) => setFilterBay(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="">All Bays</option>
            {bays.map(b => <option key={b.bay_id} value={String(b.bay_id)}>{b.name}</option>)}
          </select>
        )}

        {/* Technician filter */}
        {technicians?.length > 0 && (
          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="">All Technicians</option>
            {technicians.map(t => <option key={t.user_id} value={String(t.user_id)}>{t.name}</option>)}
          </select>
        )}

        {/* Active filter count */}
        {(search || filterStatus || filterBay || filterTech) && (
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterBay(''); setFilterTech(''); }}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label:'Total',     value: rawAppointments.length,                          color:'hsl(90 15% 18%)' },
          ...Object.entries(STATUS_META).map(([s, m]) => ({
            label: m.label,
            value: rawAppointments.filter(a => a.status === s).length,
            color: m.dot,
          })),
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-border bg-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">{label}</p>
            <p className="text-xl font-display font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Table header count */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-medium text-foreground">
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
            {(search || filterStatus || filterBay || filterTech) && (
              <span className="ml-1.5 text-muted-foreground font-normal text-xs">(filtered)</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Sort: <span className="font-medium text-foreground">{sort.field.replace('_',' ')}</span>
            <span className="opacity-60">{sort.dir === 'asc' ? '↑' : '↓'}</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-52">
            <div className="flex flex-col items-center gap-3">
              <div
                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor:'hsl(84 25% 30%)', borderTopColor:'transparent' }}
              />
              <p className="text-sm text-muted-foreground">Loading appointments…</p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No appointments found</p>
            <button
              onClick={() => setModal({ open:true, defaults:{ start:`${currentDate}T09:00`, end:`${currentDate}T10:00` } })}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white"
              style={{ background:'hsl(84 25% 30%)' }}
            >
              <Plus className="h-3.5 w-3.5" /> Book First Appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background:'hsl(45 20% 96%)' }}>
                  {[
                    { field:'scheduled_start', label:'Date & Time',    Icon: Clock    },
                    { field:'customer_id',     label:'Customer',       Icon: User     },
                    { field:'vehicle_id',      label:'Vehicle',        Icon: Car      },
                    { field:'service_type',    label:'Service',        Icon: Wrench   },
                    { field:'technician_id',   label:'Technician',     Icon: User     },
                    { field:'bay_id',          label:'Bay',            Icon: MapPin   },
                    { field:'status',          label:'Status',         Icon: null     },
                  ].map(({ field, label, Icon }) => (
                    <th
                      key={field}
                      onClick={() => toggleSort(field)}
                      className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none border-b border-border transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        {Icon && <Icon className="h-3.5 w-3.5 opacity-60" />}
                        {label}
                        <SortIcon field={field} sort={sort} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    Is Walk-in
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border w-10">
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a, idx) => {
                  const meta = STATUS_META[a.status] ?? STATUS_META.booked;
                  const isEven = idx % 2 === 0;
                  return (
                    <Fragment key={a.appointment_id}>
                      <tr
                        onClick={() => setSelectedAppointment(a)}
                        className="group transition-colors hover:bg-accent/50 cursor-pointer"
                        style={{ background: isEven ? 'white' : 'hsl(45 25% 98.5%)' }}
                      >
                        {/* Date & Time */}
                        <td className="px-4 py-3 border-b border-border/50">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground text-xs">
                              {new Date(a.scheduled_start).toLocaleDateString(undefined,{ weekday:'short', month:'short', day:'numeric' })}
                            </span>
                            <span className="text-muted-foreground text-[11px] font-mono mt-0.5">
                              {formatTime(a.scheduled_start)}
                              {a.scheduled_end && ` – ${formatTime(a.scheduled_end)}`}
                            </span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                              style={{ background:'hsl(84 20% 89%)', color:'hsl(84 25% 25%)' }}
                            >
                              {(customerName(a)[0] ?? '?').toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground truncate max-w-32">{customerName(a)}</span>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-3 border-b border-border/50">
                          <span className="text-foreground truncate block max-w-36">{vehicleName(a)}</span>
                          {a.vehicle?.year && <span className="text-[11px] text-muted-foreground">{a.vehicle.year}</span>}
                        </td>

                        {/* Service */}
                        <td className="px-4 py-3 border-b border-border/50">
                          <span
                            className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium"
                            style={{ background:'hsl(84 15% 94%)', borderColor:'hsl(84 15% 78%)', color:'hsl(84 25% 28%)' }}
                          >
                            {a.service_type ?? '—'}
                          </span>
                        </td>

                        {/* Technician */}
                        <td className="px-4 py-3 border-b border-border/50">
                          <span className="text-foreground text-sm">{techName(a)}</span>
                        </td>

                        {/* Bay */}
                        <td className="px-4 py-3 border-b border-border/50">
                          {a.bay ? (
                            <span
                              className="inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium"
                              style={{ background:'hsl(220 20% 96%)', borderColor:'hsl(220 15% 82%)', color:'hsl(220 20% 35%)' }}
                            >
                              {a.bay.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 border-b border-border/50">
                          <StatusSelect
                            apptId={a.appointment_id}
                            current={a.status}
                            onChange={(id, s) => updateStatus.mutate({ appointmentId: id, status: s })}
                          />
                          {(a.status === 'confirmed' || a.status === 'booked') && (
                            <Link
                              to={`/checkins/new?appointmentId=${a.appointment_id}&vehicleId=${a.vehicle_id}&customerId=${a.customer_id}`}
                              className="mt-1 block text-[10px] font-medium underline"
                              style={{ color: meta.text }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Check in →
                            </Link>
                          )}
                        </td>

                        {/* Walk-in */}
                        <td className="px-4 py-3 border-b border-border/50 text-center">
                          {a.is_walkin ? (
                            <span
                              className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background:'hsl(38 90% 94%)', borderColor:'hsl(38 75% 62%)', color:'hsl(38 55% 28%)' }}
                            >
                              Walk-in
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 border-b border-border/50 text-right">
                          <RowActions appointment={a} onAction={handleRowAction} />
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {appointments.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{appointments.length}</span> of{' '}
              <span className="font-semibold text-foreground">{rawAppointments.length}</span> appointments
            </p>
            <div className="flex gap-2">
              {Object.entries(STATUS_META).map(([s, m]) => (
                <div key={s} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.dot }} />
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <AppointmentDrawer 
        appointment={selectedAppointment} 
        isOpen={!!selectedAppointment} 
        onClose={() => setSelectedAppointment(null)} 
        onEdit={(a) => setModal({ open: true, defaults: {}, editData: a })}
        onReschedule={(a) => setModal({ open: true, defaults: {}, editData: a })}
      />

      <NewAppointmentModal
        open={modal.open}
        onClose={() => setModal({ open:false, defaults:{}, editData: null })}
        bays={bays}
        defaultDate={currentDate}
        defaultStart={modal.defaults?.start}
        defaultEnd={modal.defaults?.end}
        editData={modal.editData}
      />
    </DashboardLayout>
  );
}
