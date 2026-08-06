import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserPlus, UserCheck, Star, Truck, DollarSign,
  MessageSquareWarning, SmilePlus, Plus, Search, Eye,
  Pencil, Trash2, Car, CalendarPlus, ClipboardCheck,
  FileText, Receipt, ChevronDown, MoreHorizontal,
  TrendingUp, Filter, Download, BarChart3, RotateCcw,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCustomers, useCustomerStats, useDeleteCustomer } from '@/features/customers/hooks/useCustomers';
import { AddCustomerModal } from '@/features/customers/components/AddCustomerModal';
import { CustomerReportsModal } from '@/features/customers/components/CustomerReportsModal';

// ─── Stat card config ───────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    key: 'total_customers',
    label: 'Total Customers',
    icon: Users,
    accent: 'hsl(84 25% 30%)',
    accentBg: 'hsl(84 20% 93%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'new_this_month',
    label: 'New This Month',
    icon: UserPlus,
    accent: 'hsl(210 60% 40%)',
    accentBg: 'hsl(210 55% 94%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'active_customers',
    label: 'Active Customers',
    icon: UserCheck,
    accent: 'hsl(145 45% 32%)',
    accentBg: 'hsl(145 35% 93%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'vip_customers',
    label: 'VIP Customers',
    icon: Star,
    accent: 'hsl(42 75% 40%)',
    accentBg: 'hsl(42 60% 93%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'fleet_customers',
    label: 'Fleet Customers',
    icon: Truck,
    accent: 'hsl(265 45% 42%)',
    accentBg: 'hsl(265 35% 94%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'customers_with_outstanding_balance',
    label: 'Outstanding Balance',
    icon: DollarSign,
    accent: 'hsl(0 60% 42%)',
    accentBg: 'hsl(0 55% 94%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'open_complaints',
    label: 'Open Complaints',
    icon: MessageSquareWarning,
    accent: 'hsl(22 70% 40%)',
    accentBg: 'hsl(22 55% 93%)',
    format: (v) => v ?? '—',
  },
  {
    key: 'satisfaction_rate',
    label: 'Satisfaction Rate',
    icon: SmilePlus,
    accent: 'hsl(170 45% 32%)',
    accentBg: 'hsl(170 35% 93%)',
    format: (v) => (v != null ? `${v}%` : '—'),
  },
];

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({ label, icon: Icon, value, accent, accentBg }) {
  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-md"
      style={{ background: 'hsl(45 30% 99%)', borderColor: 'hsl(45 15% 87%)' }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.12em] uppercase leading-tight" style={{ color: 'hsl(90 8% 48%)' }}>
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0" style={{ background: accentBg }}>
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        </div>
      </div>
      <p className="font-display text-2xl font-bold tracking-tight leading-none" style={{ color: 'hsl(90 15% 12%)' }}>
        {value}
      </p>
    </div>
  );
}

// ─── Customer Type Badge ─────────────────────────────────────────────────────

const TYPE_STYLES = {
  fleet:      { bg: 'hsl(265 35% 94%)', text: 'hsl(265 45% 38%)' },
  corporate:  { bg: 'hsl(210 55% 94%)', text: 'hsl(210 60% 36%)' },
  individual: { bg: 'hsl(84 20% 91%)',  text: 'hsl(84 30% 28%)' },
};

function TypeBadge({ type }) {
  const t = (type ?? 'individual').toLowerCase();
  const s = TYPE_STYLES[t] ?? TYPE_STYLES.individual;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: s.bg, color: s.text }}
    >
      {t}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────

function StatusBadge({ customer }) {
  const segment = customer.segment?.toLowerCase();
  if (segment === 'vip') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
        style={{ background: 'hsl(42 60% 93%)', color: 'hsl(42 75% 35%)' }}>
        <Star className="h-2.5 w-2.5" /> VIP
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize"
      style={{ background: 'hsl(145 35% 93%)', color: 'hsl(145 45% 30%)' }}>
      Active
    </span>
  );
}

// ─── Action Dropdown ─────────────────────────────────────────────────────────

function ActionMenu({ customer, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const actions = [
    {
      group: 'Customer',
      items: [
        { label: 'View Details', icon: Eye, href: `/customers/${customer.customer_id}` },
        { label: 'Edit Customer', icon: Pencil, onClick: () => { onEdit(customer); setOpen(false); } },
        { label: 'Delete Customer', icon: Trash2, onClick: () => { onDelete(customer); setOpen(false); }, danger: true },
      ],
    },
    {
      group: 'Vehicles & Service',
      items: [
        { label: 'Add Vehicle', icon: Car, href: `/customers/${customer.customer_id}/add-vehicle` },
        { label: 'Book Appointment', icon: CalendarPlus, href: `/appointments/new?customerId=${customer.customer_id}` },
        { label: 'Check-In Vehicle', icon: ClipboardCheck, href: `/checkins/new?customerId=${customer.customer_id}` },
      ],
    },
    {
      group: 'Finance',
      items: [
        { label: 'Create Quotation', icon: FileText, href: `/quotations/new?customerId=${customer.customer_id}` },
        { label: 'Create Invoice', icon: Receipt, href: `/invoices/new?customerId=${customer.customer_id}` },
      ],
    },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        id={`action-menu-${customer.customer_id}`}
        onClick={() => setOpen((o) => !o)}
        className="flex h-7 w-7 items-center justify-center rounded-lg border transition-colors"
        style={{
          borderColor: open ? 'hsl(84 25% 55%)' : 'hsl(45 15% 83%)',
          background: open ? 'hsl(84 20% 93%)' : 'transparent',
          color: 'hsl(90 8% 42%)',
        }}
        title="Actions"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl overflow-hidden shadow-xl"
          style={{
            background: 'hsl(45 30% 99%)',
            border: '1px solid hsl(45 15% 85%)',
            top: '100%',
          }}
        >
          {actions.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && <div className="mx-3 my-1" style={{ height: 1, background: 'hsl(45 15% 90%)' }} />}
              <div className="px-3 pt-2 pb-0.5">
                <p className="font-mono text-[9px] tracking-[0.12em] uppercase" style={{ color: 'hsl(90 8% 58%)' }}>
                  {group.group}
                </p>
              </div>
              {group.items.map((action) => {
                const Icon = action.icon;
                const sharedStyle = {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: '13px',
                  textAlign: 'left',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: action.danger ? 'hsl(0 60% 44%)' : 'hsl(90 12% 20%)',
                  borderRadius: '6px',
                };

                const content = (
                  <>
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {action.label}
                  </>
                );

                return action.href ? (
                  <Link
                    key={action.label}
                    to={action.href}
                    style={{ ...sharedStyle, textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = action.danger ? 'hsl(0 55% 96%)' : 'hsl(84 15% 94%)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    style={sharedStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.background = action.danger ? 'hsl(0 55% 96%)' : 'hsl(84 15% 94%)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {content}
                  </button>
                );
              })}
              <div className="h-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nav sections ────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Front Desk',
    items: [{ label: 'Customers', icon: Users, path: '/customers' }],
  },
];

// ─── Main page ───────────────────────────────────────────────────────────────

export function CustomersPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  // Filters state
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [vipFilter, setVipFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState('all');

  const { data: stats } = useCustomerStats(user?.branch_id);
  const { data: customersData, isLoading } = useCustomers({ search, page });
  const deleteCustomer = useDeleteCustomer();

  const rawCustomers = customersData?.data ?? [];

  // Client-side filtering for active filter options
  const customers = rawCustomers.filter((c) => {
    if (customerTypeFilter !== 'all' && (c.customer_type ?? '').toLowerCase() !== customerTypeFilter) return false;
    if (vipFilter === 'vip' && (c.segment ?? '').toLowerCase() !== 'vip') return false;
    if (balanceFilter === 'has_balance' && !(parseFloat(c.outstanding_balance ?? 0) > 0)) return false;
    if (balanceFilter === 'clear' && parseFloat(c.outstanding_balance ?? 0) > 0) return false;
    return true;
  });

  function handleDelete(customer) {
    if (confirm(`Delete ${customer.name}? This action cannot be undone.`)) {
      deleteCustomer.mutate(customer.customer_id);
    }
  }

  function handleEdit(customer) {
    setEditCustomer(customer);
    setModalOpen(true);
  }

  function handleAdd() {
    setEditCustomer(null);
    setModalOpen(true);
  }

  function handleModalClose() {
    setModalOpen(false);
    setEditCustomer(null);
  }

  const TABLE_HEADERS = [
    'Customer ID',
    'Full Name',
    'Phone Number',
    'Email',
    'Customer Type',
    'Vehicles',
    'Last Visit',
    'Outstanding',
    'Status',
    'Actions',
  ];

  const navSections = getNavSections(user?.role);

  return (
    <DashboardLayout navSections={navSections} pageTitle="Customers" roleLabel={user?.username ?? 'Staff'}>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8 mb-6">
        {STAT_CARDS.map(({ key, label, icon, accent, accentBg, format }) => (
          <StatCard
            key={key}
            label={label}
            icon={icon}
            value={format(stats?.[key])}
            accent={accent}
            accentBg={accentBg}
          />
        ))}
      </div>

      {/* ── Toolbar & Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="relative w-64 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(90 8% 52%)' }} />
            <input
              id="customer-search"
              type="text"
              placeholder="Search name, phone, email, plate, VIN…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2"
              style={{
                borderColor: 'hsl(45 15% 83%)',
                background: 'hsl(45 30% 99%)',
                '--tw-ring-color': 'hsl(84 25% 40% / 0.2)',
              }}
            />
          </div>

          {/* Filter: Customer Type */}
          <select
            value={customerTypeFilter}
            onChange={(e) => setCustomerTypeFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs font-medium bg-white outline-none"
            style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 12% 25%)' }}
          >
            <option value="all">Type: All</option>
            <option value="individual">Individual</option>
            <option value="fleet">Fleet</option>
            <option value="corporate">Corporate</option>
          </select>

          {/* Filter: VIP */}
          <select
            value={vipFilter}
            onChange={(e) => setVipFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs font-medium bg-white outline-none"
            style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 12% 25%)' }}
          >
            <option value="all">Segment: All</option>
            <option value="vip">VIP Only</option>
          </select>

          {/* Filter: Balance */}
          <select
            value={balanceFilter}
            onChange={(e) => setBalanceFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs font-medium bg-white outline-none"
            style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 12% 25%)' }}
          >
            <option value="all">Balance: All</option>
            <option value="has_balance">Outstanding Balance</option>
            <option value="clear">Clear Balance</option>
          </select>

          {(customerTypeFilter !== 'all' || vipFilter !== 'all' || balanceFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setCustomerTypeFilter('all');
                setVipFilter('all');
                setBalanceFilter('all');
                setSearch('');
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Reset Filters"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportsOpen(true)}
            id="reports-analytics-btn"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors bg-white hover:bg-slate-50"
            style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 12% 25%)' }}
          >
            <BarChart3 className="h-4 w-4 text-emerald-700" />
            Reports & Analytics
          </button>

          <button
            onClick={handleAdd}
            id="add-customer-btn"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, hsl(84 30% 32%) 0%, hsl(84 25% 26%) 100%)' }}
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid hsl(45 15% 87%)', background: 'hsl(45 30% 99%)' }}
      >
        {/* Table header row */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid hsl(45 15% 89%)' }}>
          <div>
            <p className="font-display text-sm font-semibold" style={{ color: 'hsl(90 15% 12%)' }}>Customer List</p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(90 8% 52%)' }}>
              {isLoading ? 'Loading…' : `${customersData?.total ?? customers.length} customers total`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(45 15% 89%)', background: 'hsl(45 15% 97%)' }}>
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-mono text-[10px] tracking-[0.1em] uppercase whitespace-nowrap"
                    style={{ color: 'hsl(90 8% 48%)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid hsl(45 15% 92%)' }}>
                    {TABLE_HEADERS.map((h) => (
                      <td key={h} className="px-4 py-3.5">
                        <div className="h-4 rounded animate-pulse" style={{ background: 'hsl(45 15% 91%)', width: h === 'Full Name' ? '120px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={TABLE_HEADERS.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'hsl(84 15% 93%)' }}>
                        <Users className="h-5 w-5" style={{ color: 'hsl(84 25% 45%)' }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'hsl(90 12% 25%)' }}>No customers found</p>
                        <p className="text-xs mt-1" style={{ color: 'hsl(90 8% 52%)' }}>
                          {search ? 'Try a different search term' : 'Add your first customer to get started'}
                        </p>
                      </div>
                      {!search && (
                        <button
                          onClick={handleAdd}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white mt-1"
                          style={{ background: 'hsl(84 25% 32%)' }}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Customer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c, idx) => (
                  <tr
                    key={c.customer_id}
                    style={{
                      borderBottom: idx < customers.length - 1 ? '1px solid hsl(45 15% 92%)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'hsl(84 15% 97%)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Customer ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] rounded px-1.5 py-0.5" style={{ background: 'hsl(45 15% 93%)', color: 'hsl(90 8% 40%)' }}>
                        #{c.customer_id}
                      </span>
                    </td>

                    {/* Full Name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                          style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 30% 28%)' }}
                        >
                          {(c.name ?? '?')[0].toUpperCase()}
                        </div>
                        <span className="font-medium whitespace-nowrap" style={{ color: 'hsl(90 15% 12%)' }}>{c.name ?? '—'}</span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'hsl(90 8% 42%)' }}>
                      {c.phone ?? <span style={{ color: 'hsl(90 8% 65%)' }}>—</span>}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5" style={{ color: 'hsl(90 8% 42%)' }}>
                      <span className="block max-w-[180px] truncate" title={c.email}>
                        {c.email ?? <span style={{ color: 'hsl(90 8% 65%)' }}>—</span>}
                      </span>
                    </td>

                    {/* Customer Type */}
                    <td className="px-4 py-3.5">
                      <TypeBadge type={c.customer_type} />
                    </td>

                    {/* Vehicles */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5 shrink-0" style={{ color: 'hsl(90 8% 52%)' }} />
                        <span className="font-medium" style={{ color: 'hsl(90 12% 22%)' }}>{c.vehicles?.length ?? 0}</span>
                      </div>
                    </td>

                    {/* Last Visit */}
                    <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: 'hsl(90 8% 48%)' }}>
                      {c.last_visit
                        ? new Date(c.last_visit).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : <span style={{ color: 'hsl(90 8% 65%)' }}>—</span>
                      }
                    </td>

                    {/* Outstanding Balance */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {c.outstanding_balance && parseFloat(c.outstanding_balance) > 0 ? (
                        <span className="font-mono text-xs font-medium" style={{ color: 'hsl(0 60% 42%)' }}>
                          ETB {parseFloat(c.outstanding_balance).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: 'hsl(145 45% 35%)' }}>Clear</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge customer={c} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <ActionMenu
                        customer={c}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {customersData && customersData.last_page > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: '1px solid hsl(45 15% 89%)', background: 'hsl(45 15% 97%)' }}
          >
            <p className="text-xs" style={{ color: 'hsl(90 8% 52%)' }}>
              Page {customersData.current_page} of {customersData.last_page} · {customersData.total} customers
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 8% 38%)' }}
              >
                Previous
              </button>
              <button
                disabled={page >= customersData.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
                style={{ borderColor: 'hsl(45 15% 83%)', color: 'hsl(90 8% 38%)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AddCustomerModal
        open={modalOpen}
        onClose={handleModalClose}
        editCustomer={editCustomer}
      />
      <CustomerReportsModal
        open={reportsOpen}
        onClose={() => setReportsOpen(false)}
        stats={stats}
      />
    </DashboardLayout>
  );
}
