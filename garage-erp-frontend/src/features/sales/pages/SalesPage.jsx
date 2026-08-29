import { useState } from "react";
import {
  TrendingUp, DollarSign, Receipt,
  BarChart3, ArrowUpRight, ArrowDownRight, Package,
  CheckCircle2, Clock, XCircle, ChevronDown,
} from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { getNavSections } from "@/layouts/navSections";
import { useAuthStore } from "@/features/auth/store/authStore";

const STATS = [
  { label: "Total Revenue",     value: "ETB 284,520", delta: "+18.4%",           up: true,  icon: DollarSign },
  { label: "This Month",        value: "ETB 47,300",  delta: "+6.2%",            up: true,  icon: TrendingUp },
  { label: "Total Invoices",    value: "312",          delta: "+24 this month",   up: true,  icon: Receipt },
  { label: "Avg. Invoice",      value: "ETB 912",      delta: "-3.1%",            up: false, icon: BarChart3 },
  { label: "Parts Sold (units)",value: "1,840",        delta: "+110 vs last mo.", up: true,  icon: Package },
];

const WEEKLY = [
  { day: "Mon", revenue: 12400, parts: 4200 },
  { day: "Tue", revenue: 18700, parts: 6100 },
  { day: "Wed", revenue:  9800, parts: 3400 },
  { day: "Thu", revenue: 21300, parts: 7800 },
  { day: "Fri", revenue: 26100, parts: 9200 },
  { day: "Sat", revenue: 19500, parts: 6500 },
  { day: "Sun", revenue:  8200, parts: 2900 },
];

const TOP_SERVICES = [
  { name: "Full Engine Service",       count: 48,  revenue: "ETB 52,800", pct: 87 },
  { name: "Brake Inspection & Repair", count: 72,  revenue: "ETB 31,680", pct: 72 },
  { name: "Oil Change",                count: 134, revenue: "ETB 20,100", pct: 60 },
  { name: "AC Recharge",               count: 39,  revenue: "ETB 15,210", pct: 45 },
  { name: "Tyre Replacement",          count: 56,  revenue: "ETB 12,320", pct: 38 },
];

const STATUS_META = {
  paid:    { bg: "hsl(84 20% 89%)",  text: "hsl(84 25% 25%)",  icon: CheckCircle2, label: "Paid" },
  pending: { bg: "hsl(42 55% 90%)", text: "hsl(42 55% 32%)", icon: Clock,        label: "Pending" },
  overdue: { bg: "hsl(0 30% 95%)",  text: "hsl(0 40% 40%)",  icon: XCircle,      label: "Overdue" },
};

const INVOICES = [
  { id: "INV-0088", customer: "Dagmawit Bekele", vehicle: "Toyota Hilux — AA 123-456",  service: "Engine Service", amount: "ETB 4,200", status: "paid",    date: "2026-08-28" },
  { id: "INV-0087", customer: "Henok Girma",     vehicle: "Suzuki Dzire — AA 987-321",  service: "Oil Change",     amount: "ETB 650",   status: "paid",    date: "2026-08-27" },
  { id: "INV-0086", customer: "Meron Tesfaye",   vehicle: "Isuzu D-Max — AA 456-789",   service: "Brake Repair",   amount: "ETB 1,800", status: "pending", date: "2026-08-26" },
  { id: "INV-0085", customer: "Ruth Alemayehu",  vehicle: "Toyota Corolla — AA 234",    service: "AC Recharge",    amount: "ETB 1,100", status: "overdue", date: "2026-08-24" },
  { id: "INV-0084", customer: "Fikremariam M.",  vehicle: "Hyundai Tucson — AA 111",    service: "Tyre (x4)",      amount: "ETB 2,480", status: "paid",    date: "2026-08-23" },
  { id: "INV-0083", customer: "Samuel Alemu",    vehicle: "Nissan Navara — AA 543",     service: "Full Service",   amount: "ETB 6,700", status: "paid",    date: "2026-08-22" },
];

function RevenueChart() {
  const [hover, setHover] = useState(null);
  const maxR = Math.max(...WEEKLY.map((d) => d.revenue));
  const maxP = Math.max(...WEEKLY.map((d) => d.parts));

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-sm font-semibold tracking-tight">Weekly Revenue Breakdown</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(84 30% 38%)" }} />
            Services
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: "hsl(200 40% 55%)" }} />
            Parts
          </span>
        </div>
      </div>

      <div className="flex h-48 items-end gap-2 px-1">
        {WEEKLY.map((d, i) => (
          <div
            key={d.day}
            className="relative flex flex-1 flex-col items-center gap-1"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <div
                className="absolute bottom-full mb-2 rounded-md border border-border bg-card px-3 py-2 text-xs shadow-md z-10 whitespace-nowrap"
                style={{ left: "50%", transform: "translateX(-50%)" }}
              >
                <p className="font-medium mb-0.5">{d.day}</p>
                <p style={{ color: "hsl(84 30% 38%)" }}>Services: ETB {d.revenue.toLocaleString()}</p>
                <p style={{ color: "hsl(200 40% 55%)" }}>Parts: ETB {d.parts.toLocaleString()}</p>
              </div>
            )}
            <div className="flex w-full items-end gap-0.5" style={{ height: "11rem" }}>
              <div
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${(d.revenue / maxR) * 100}%`,
                  background: hover === i ? "hsl(84 35% 45%)" : "linear-gradient(180deg, hsl(84 30% 44%) 0%, hsl(84 28% 32%) 100%)",
                  minHeight: 4,
                }}
              />
              <div
                className="flex-1 rounded-t-sm transition-all"
                style={{
                  height: `${(d.parts / maxP) * 100}%`,
                  background: hover === i ? "hsl(200 45% 62%)" : "linear-gradient(180deg, hsl(200 40% 60%) 0%, hsl(200 38% 46%) 100%)",
                  minHeight: 4,
                }}
              />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopServicesPanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h2 className="font-display text-sm font-semibold tracking-tight mb-4">Top Services by Revenue</h2>
      <div className="space-y-4">
        {TOP_SERVICES.map((svc) => (
          <div key={svc.name}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{svc.name}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{svc.count} jobs</span>
                <span className="font-medium text-foreground">{svc.revenue}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(84 8% 20%)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${svc.pct}%`, background: "linear-gradient(90deg, hsl(84 30% 38%) 0%, hsl(84 35% 50%) 100%)" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InvoicesTable({ filter, setFilter }) {
  const filtered = filter ? INVOICES.filter((inv) => inv.status === filter) : INVOICES;
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-border">
        <h2 className="font-display text-sm font-semibold tracking-tight">Recent Invoices</h2>
        <div className="flex items-center gap-2">
          {[null, "paid", "pending", "overdue"].map((s) => (
            <button
              key={s ?? "all"}
              onClick={() => setFilter(s)}
              className="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
              style={
                filter === s
                  ? { background: "hsl(84 25% 30%)", color: "hsl(45 30% 95%)" }
                  : { background: "hsl(84 8% 14%)", color: "hsl(84 8% 60%)" }
              }
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {["Invoice", "Customer", "Vehicle", "Service", "Amount", "Status", "Date"].map((h) => (
                <th key={h} className="px-5 py-3 font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground text-sm">No invoices found.</td></tr>
            ) : (
              filtered.map((inv) => {
                const meta = STATUS_META[inv.status];
                const StatusIcon = meta.icon;
                return (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.id}</td>
                    <td className="px-5 py-3 font-medium">{inv.customer}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">{inv.vehicle}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.service}</td>
                    <td className="px-5 py-3 font-semibold">{inv.amount}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium" style={{ background: meta.bg, color: meta.text }}>
                        <StatusIcon className="h-3 w-3" />{meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">{inv.date}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SalesPage() {
  const { user } = useAuthStore();
  const [invoiceFilter, setInvoiceFilter] = useState(null);
  const [period, setPeriod] = useState("This Month");

  return (
    <DashboardLayout
      navSections={getNavSections(user?.role)}
      pageTitle="Sales"
      roleLabel={user?.employee?.first_name ?? user?.username ?? "Staff"}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-sm text-muted-foreground">Track revenue, invoices, and sales performance.</p>
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="appearance-none rounded-md border border-input bg-background pl-3 pr-8 py-2 text-sm outline-none cursor-pointer"
          >
            {["This Week", "This Month", "This Quarter", "This Year"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5 mb-6">
        {STATS.map(({ label, value, delta, up, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">{label}</span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {delta && (
              <p className="mt-1 flex items-center gap-0.5 text-xs" style={{ color: up ? "hsl(84 35% 42%)" : "hsl(0 45% 48%)" }}>
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {delta}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px] mb-4">
        <RevenueChart />
        <TopServicesPanel />
      </div>

      <InvoicesTable filter={invoiceFilter} setFilter={setInvoiceFilter} />
    </DashboardLayout>
  );
}
