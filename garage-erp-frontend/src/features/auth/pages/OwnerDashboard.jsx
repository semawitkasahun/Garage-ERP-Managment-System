import {
  LayoutDashboard, CalendarDays, ClipboardCheck, Users, UserPlus,
  Car, FileText, Wrench, ShieldCheck, Package, Truck, ShoppingCart,
  Receipt, CreditCard, Landmark, UserCog, KeyRound, Boxes, BarChart3,
  Settings, DollarSign, AlertTriangle,
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';

const NAV_SECTIONS = [
  { label: 'Overview', items: [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/owner/dashboard' },
  ]},
  { label: 'Front Desk', items: [
    { label: 'Appointments', icon: CalendarDays, path: '/appointments' },
    { label: 'Check-In', icon: ClipboardCheck, path: '/checkins/new' },
    { label: 'Customers', icon: Users, path: '/customers' },
    { label: 'Leads', icon: UserPlus, disabled: true },
  ]},
  { label: 'Service', items: [
    { label: 'Vehicles', icon: Car, disabled: true },
    { label: 'Quotations', icon: FileText, disabled: true },
    { label: 'Work Orders', icon: Wrench, disabled: true },
    { label: 'Quality Control', icon: ShieldCheck, disabled: true },
  ]},
  { label: 'Inventory & Supply', items: [
    { label: 'Inventory', icon: Package, disabled: true },
    { label: 'Suppliers', icon: Truck, disabled: true },
    { label: 'Purchasing', icon: ShoppingCart, disabled: true },
    { label: 'Sales', icon: Receipt, disabled: true },
  ]},
  { label: 'Finance', items: [
    { label: 'Billing & Payments', icon: CreditCard, disabled: true },
    { label: 'Financial Management', icon: Landmark, disabled: true },
  ]},
  { label: 'Human Resource Management', items: [
    { label: 'Employees', icon: UserCog, disabled: true },
    { label: 'Users & Roles', icon: KeyRound, disabled: true },
    { label: 'Attendance and shift scheduling', icon: KeyRound, disabled: true },
    { label: 'Leave management', icon: KeyRound, disabled: true },
  ]},
  { label: 'Other', items: [
    { label: 'Assets', icon: Boxes, disabled: true },
    { label: 'Reports', icon: BarChart3, disabled: true },
    { label: 'Settings', icon: Settings, disabled: true },
  ]},
];

// TODO: replace with a real query, e.g. useQuery(['owner-dashboard'], fetchOwnerStats)
const STATS = [
  { label: "Today's Revenue", value: '$4,285', delta: '+12.4%', icon: DollarSign },
  { label: 'Active Work Orders', value: '18', delta: '+3 today', icon: Wrench },
  { label: 'Vehicles In Shop', value: '11', delta: null, icon: Car },
  { label: 'Pending Quotations', value: '6', delta: 'awaiting approval', icon: FileText },
  { label: 'Low Stock Items', value: '5', delta: 'needs reorder', icon: AlertTriangle },
];

const WEEKLY_REVENUE = [
  { day: 'Mon', value: 3200 }, { day: 'Tue', value: 4100 }, { day: 'Wed', value: 2800 },
  { day: 'Thu', value: 5200 }, { day: 'Fri', value: 6100 }, { day: 'Sat', value: 4800 },
  { day: 'Sun', value: 2100 },
];

const STATUS_STYLES = {
  'In Progress': { bg: 'hsl(84 25% 30% / 0.15)', text: 'hsl(84 30% 28%)' },
  'Completed': { bg: 'hsl(84 20% 89%)', text: 'hsl(84 25% 25%)' },
  'Pending': { bg: 'hsl(42 55% 90%)', text: 'hsl(42 55% 32%)' },
  'On Hold': { bg: 'hsl(0 0% 92%)', text: 'hsl(0 0% 40%)' },
};

// TODO: replace with real work_orders query, filtered/sorted by updated_at desc, limit 6
const RECENT_WORK_ORDERS = [
  { id: 'WO-1042', vehicle: 'Toyota Hilux — AA 123-456', customer: 'D. Bekele', status: 'In Progress', technician: 'S. Alemu', amount: '$420' },
  { id: 'WO-1041', vehicle: 'Suzuki Dzire — AA 987-321', customer: 'H. Girma', status: 'Pending', technician: '—', amount: '$180' },
  { id: 'WO-1040', vehicle: 'Isuzu D-Max — AA 456-789', customer: 'M. Tesfaye', status: 'Completed', technician: 'K. Yonas', amount: '$960' },
  { id: 'WO-1039', vehicle: 'Toyota Corolla — AA 234-567', customer: 'R. Alemayehu', status: 'On Hold', technician: 'S. Alemu', amount: '$310' },
  { id: 'WO-1038', vehicle: 'Hyundai Tucson — AA 111-222', customer: 'F. Mekonnen', status: 'Completed', technician: 'K. Yonas', amount: '$540' },
];

function WeeklyRevenueChart() {
  const max = Math.max(...WEEKLY_REVENUE.map((d) => d.value));
  return (
    <div className="flex h-40 items-end gap-3 px-1">
      {WEEKLY_REVENUE.map((d) => (
        <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-sm transition-all"
            style={{
              height: `${(d.value / max) * 100}%`,
              background: 'linear-gradient(180deg, hsl(84 30% 40%) 0%, hsl(84 30% 30%) 100%)',
              minHeight: 4,
            }}
            title={`$${d.value.toLocaleString()}`}
          />
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{d.day}</span>
        </div>
      ))}
    </div>
  );
}

export function OwnerDashboard() {
  return (
    <DashboardLayout navSections={NAV_SECTIONS} pageTitle="Dashboard" roleLabel="Owner">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5 mb-6">
        {STATS.map(({ label, value, delta, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {delta && <p className="text-xs text-muted-foreground mt-1">{delta}</p>}
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="rounded-lg border border-border bg-card p-5 mb-4">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Weekly revenue</h2>
        <WeeklyRevenueChart />
      </div>

      {/* Recent work orders */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Recent work orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {['ID', 'Vehicle', 'Customer', 'Status', 'Technician', 'Amount'].map((h) => (
                  <th key={h} className="pb-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_WORK_ORDERS.map((wo) => {
                const s = STATUS_STYLES[wo.status];
                return (
                  <tr key={wo.id} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-mono text-xs">{wo.id}</td>
                    <td className="py-2.5">{wo.vehicle}</td>
                    <td className="py-2.5">{wo.customer}</td>
                    <td className="py-2.5">
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{ background: s.bg, color: s.text }}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{wo.technician}</td>
                    <td className="py-2.5 font-medium">{wo.amount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}