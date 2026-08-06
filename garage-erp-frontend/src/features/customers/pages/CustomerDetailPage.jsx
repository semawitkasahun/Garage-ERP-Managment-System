import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Users, LayoutDashboard, CalendarDays, ClipboardCheck,
  User, Car, CalendarPlus, ClipboardList, FileText, Receipt,
  CreditCard, MessageSquare, Mail, Printer,
  LayoutGrid, Wrench, History, DollarSign, MessageSquareWarning,
  MessagesSquare, FolderOpen, StickyNote, Star, Phone,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCustomer } from '@/features/customers/hooks/useCustomers';

// Tab components
import { OverviewTab }       from '@/features/customers/components/tabs/OverviewTab';
import { VehiclesTab }       from '@/features/customers/components/tabs/VehiclesTab';
import { AppointmentsTab }   from '@/features/customers/components/tabs/AppointmentsTab';
import { CheckInsTab }       from '@/features/customers/components/tabs/CheckInsTab';
import { QuotationsTab }     from '@/features/customers/components/tabs/QuotationsTab';
import { WorkOrdersTab }     from '@/features/customers/components/tabs/WorkOrdersTab';
import { ServiceHistoryTab } from '@/features/customers/components/tabs/ServiceHistoryTab';
import { BillingTab }        from '@/features/customers/components/tabs/BillingTab';
import { ComplaintsTab }     from '@/features/customers/components/tabs/ComplaintsTab';
import { CommunicationTab }  from '@/features/customers/components/tabs/CommunicationTab';
import { DocumentsTab }      from '@/features/customers/components/tabs/DocumentsTab';
import { NotesTab }          from '@/features/customers/components/tabs/NotesTab';

// ─── Nav ────────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Front Desk',
    items: [
      { label: 'Customers', icon: Users, path: '/customers' },
    ],
  },
];

// ─── Tabs config ─────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',       label: 'Overview',         icon: LayoutGrid          },
  { id: 'vehicles',       label: 'Vehicles',          icon: Car                },
  { id: 'appointments',   label: 'Appointments',      icon: CalendarDays       },
  { id: 'checkins',       label: 'Check-Ins',         icon: ClipboardCheck     },
  { id: 'quotations',     label: 'Quotations',        icon: FileText           },
  { id: 'work_orders',    label: 'Work Orders',       icon: Wrench             },
  { id: 'service',        label: 'Service History',   icon: History            },
  { id: 'billing',        label: 'Billing',           icon: DollarSign         },
  { id: 'complaints',     label: 'Complaints',        icon: MessageSquareWarning},
  { id: 'communication',  label: 'Communication',     icon: MessagesSquare     },
  { id: 'documents',      label: 'Documents',         icon: FolderOpen         },
  { id: 'notes',          label: 'Notes',             icon: StickyNote         },
];

// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions({ customer }) {
  const id = customer?.customer_id;
  const actions = [
    { label: 'Add Vehicle',        icon: Car,           href: `/customers/${id}/add-vehicle` },
    { label: 'Book Appointment',   icon: CalendarPlus,  href: `/appointments/new?customerId=${id}` },
    { label: 'Start Check-In',     icon: ClipboardList, href: `/checkins/new?customerId=${id}` },
    { label: 'Create Quotation',   icon: FileText,      href: `/quotations/new?customerId=${id}` },
    { label: 'Create Work Order',  icon: Wrench,        href: `/work-orders/new?customerId=${id}` },
    { label: 'Generate Invoice',   icon: Receipt,       href: `/invoices/new?customerId=${id}` },
    { label: 'Record Payment',     icon: CreditCard,    href: `/payments/new?customerId=${id}` },
    { label: 'Send SMS',           icon: MessageSquare, href: `#sms` },
    { label: 'Send Email',         icon: Mail,          href: `mailto:${customer?.email}` },
    { label: 'Print Customer Card',icon: Printer,       href: `#print` },
  ];

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: 'hsl(45 30% 99%)', border: '1px solid hsl(45 15% 88%)' }}>
      <p className="text-[10px] font-mono uppercase tracking-wider mb-3" style={{ color: 'hsl(90 8% 50%)' }}>Quick Actions</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 xl:grid-cols-10">
        {actions.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            to={href}
            className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-all no-underline group"
            style={{ background: 'hsl(45 15% 96%)', color: 'hsl(90 10% 28%)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsl(84 20% 91%)';
              e.currentTarget.style.color = 'hsl(84 30% 26%)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsl(45 15% 96%)';
              e.currentTarget.style.color = 'hsl(90 10% 28%)';
            }}
          >
            <Icon className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Customer header ──────────────────────────────────────────────────────────
function CustomerHeader({ customer }) {
  const initials = (customer.name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const typeColors = {
    fleet:      { bg: 'hsl(265 35% 94%)', text: 'hsl(265 45% 38%)' },
    corporate:  { bg: 'hsl(210 55% 94%)', text: 'hsl(210 60% 36%)' },
    individual: { bg: 'hsl(84 20% 91%)',  text: 'hsl(84 30% 28%)' },
  };
  const tc = typeColors[customer.customer_type?.toLowerCase()] ?? typeColors.individual;

  return (
    <div className="rounded-xl p-5 mb-5 flex flex-wrap items-center gap-4"
      style={{ background: 'linear-gradient(135deg, hsl(90 14% 8%) 0%, hsl(84 18% 14%) 100%)', border: '1px solid hsl(84 15% 20%)' }}>
      {/* Avatar */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold"
        style={{ background: 'hsl(84 25% 30% / 0.5)', color: 'hsl(84 35% 78%)' }}>
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-display text-xl font-bold" style={{ color: 'hsl(45 30% 96%)' }}>
            {customer.name}
          </h1>
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize" style={{ background: tc.bg, color: tc.text }}>
            {customer.customer_type ?? 'individual'}
          </span>
          {customer.segment?.toLowerCase() === 'vip' && (
            <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: 'hsl(42 55% 90%)', color: 'hsl(42 70% 38%)' }}>
              <Star className="h-2.5 w-2.5" /> VIP
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'hsl(84 10% 58%)' }}>
          {customer.phone && (
            <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{customer.phone}</span>
          )}
          {customer.email && (
            <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{customer.email}</span>
          )}
          <span className="flex items-center gap-1.5">
            <Car className="h-3 w-3" />{customer.vehicles?.length ?? 0} vehicle{(customer.vehicles?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <span>
            Customer since {customer.created_at ? new Date(customer.created_at).getFullYear() : '—'}
          </span>
        </div>
      </div>

      {/* Back link */}
      <Link to="/customers"
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors shrink-0"
        style={{ background: 'hsl(84 15% 20%)', color: 'hsl(84 10% 65%)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 26%)'; e.currentTarget.style.color = 'hsl(45 30% 92%)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'hsl(84 15% 20%)'; e.currentTarget.style.color = 'hsl(84 10% 65%)'; }}>
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-24 rounded-xl" style={{ background: 'hsl(45 15% 91%)' }} />
      <div className="h-10 rounded-xl" style={{ background: 'hsl(45 15% 91%)' }} />
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl" style={{ background: 'hsl(45 15% 91%)' }} />)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function CustomerDetailPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: customer, isLoading, isError } = useCustomer(id);

  function renderTab() {
    if (!customer) return null;
    switch (activeTab) {
      case 'overview':      return <OverviewTab customer={customer} />;
      case 'vehicles':      return <VehiclesTab customer={customer} />;
      case 'appointments':  return <AppointmentsTab customer={customer} />;
      case 'checkins':      return <CheckInsTab customer={customer} />;
      case 'quotations':    return <QuotationsTab customer={customer} />;
      case 'work_orders':   return <WorkOrdersTab customer={customer} />;
      case 'service':       return <ServiceHistoryTab customer={customer} />;
      case 'billing':       return <BillingTab customer={customer} />;
      case 'complaints':    return <ComplaintsTab customer={customer} />;
      case 'communication': return <CommunicationTab customer={customer} />;
      case 'documents':     return <DocumentsTab customer={customer} />;
      case 'notes':         return <NotesTab customer={customer} />;
      default:              return null;
    }
  }

  // Tab badge counts for quick reference
  function badge(tab) {
    if (!customer) return null;
    const counts = {
      vehicles:     customer.vehicles?.length,
      appointments: customer.appointments?.length,
      checkins:     customer.vehicleCheckins?.length,
      quotations:   customer.quotations?.length,
      work_orders:  customer.workOrders?.length,
      billing:      customer.invoices?.length,
      complaints:   customer.complaints?.filter(c => c.status === 'open').length,
    };
    const val = counts[tab];
    if (!val) return null;
    return (
      <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none"
        style={{ background: tab === 'complaints' ? 'hsl(0 50% 92%)' : 'hsl(84 20% 90%)', color: tab === 'complaints' ? 'hsl(0 58% 42%)' : 'hsl(84 30% 30%)' }}>
        {val}
      </span>
    );
  }

  return (
    <DashboardLayout
      navSections={getNavSections(user?.role)}
      pageTitle={isLoading ? 'Loading…' : (customer?.name ?? 'Customer Details')}
      roleLabel={user?.username ?? 'Staff'}
    >
      {isLoading ? <Skeleton /> : isError ? (
        <div className="flex flex-col items-center gap-3 py-20">
          <p className="font-medium" style={{ color: 'hsl(0 58% 40%)' }}>Failed to load customer.</p>
          <Link to="/customers" className="text-sm underline">← Back to Customers</Link>
        </div>
      ) : (
        <>
          {/* Customer header */}
          <CustomerHeader customer={customer} />

          {/* Quick actions */}
          <QuickActions customer={customer} />

          {/* Tab bar */}
          <div className="relative mb-5">
            <div className="overflow-x-auto pb-0.5 scrollbar-hide">
              <div className="flex gap-0.5 min-w-max rounded-xl p-1"
                style={{ background: 'hsl(45 15% 93%)', border: '1px solid hsl(45 15% 87%)' }}>
                {TABS.map(({ id: tabId, label, icon: Icon }) => {
                  const active = activeTab === tabId;
                  return (
                    <button
                      key={tabId}
                      id={`tab-${tabId}`}
                      onClick={() => setActiveTab(tabId)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium whitespace-nowrap transition-all"
                      style={{
                        background: active ? 'hsl(45 30% 99%)' : 'transparent',
                        color: active ? 'hsl(84 30% 26%)' : 'hsl(90 8% 48%)',
                        boxShadow: active ? '0 1px 3px hsl(45 15% 82%)' : 'none',
                        fontWeight: active ? 600 : 400,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      {label}
                      {badge(tabId)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="min-h-[400px]">
            {renderTab()}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
