import React from 'react';
import { X, TrendingUp, Users, UserCheck, Star, Truck, DollarSign, SmilePlus, BarChart3, Award, ArrowUpRight } from 'lucide-react';

export function CustomerReportsModal({ open, onClose, stats }) {
  if (!open) return null;

  const topCustomers = [
    { name: 'Bekele Transports Ltd', type: 'Fleet', vehicles: 14, spent: 'ETB 482,500', retention: '98%' },
    { name: 'Solomon Moges', type: 'VIP Individual', vehicles: 3, spent: 'ETB 145,200', retention: '100%' },
    { name: 'Ethio Express Courier', type: 'Fleet', vehicles: 8, spent: 'ETB 112,000', retention: '95%' },
    { name: 'Tigist Haile', type: 'Individual', vehicles: 2, spent: 'ETB 86,400', retention: '90%' },
    { name: 'Ababa Logistics', type: 'Fleet', vehicles: 6, spent: 'ETB 74,900', retention: '92%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 20, 12, 0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl" style={{ background: 'hsl(45 30% 98%)', border: '1px solid hsl(45 15% 88%)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ background: 'linear-gradient(135deg, hsl(90 14% 7%) 0%, hsl(84 18% 14%) 100%)', borderBottom: '1px solid hsl(84 15% 20%)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: 'hsl(84 25% 30% / 0.4)' }}>
              <BarChart3 className="h-5 w-5" style={{ color: 'hsl(84 35% 72%)' }} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold" style={{ color: 'hsl(45 30% 95%)' }}>Customer Reports & Analytics</h2>
              <p className="text-xs" style={{ color: 'hsl(84 10% 55%)' }}>Comprehensive business insights and retention metrics</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors" style={{ color: 'hsl(84 10% 55%)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Customer Growth</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold font-display" style={{ color: 'hsl(90 15% 12%)' }}>+18.4%</p>
              <p className="text-[11px] text-muted-foreground mt-1">vs previous quarter</p>
            </div>

            <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Customer Retention</span>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold font-display" style={{ color: 'hsl(90 15% 12%)' }}>92.6%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Returning rate (90 days)</p>
            </div>

            <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Fleet Retention</span>
                <Truck className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold font-display" style={{ color: 'hsl(90 15% 12%)' }}>96.1%</p>
              <p className="text-[11px] text-muted-foreground mt-1">Active contract fleets</p>
            </div>

            <div className="p-4 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Avg Satisfaction</span>
                <SmilePlus className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold font-display" style={{ color: 'hsl(90 15% 12%)' }}>4.8 / 5.0</p>
              <p className="text-[11px] text-muted-foreground mt-1">From CSAT surveys</p>
            </div>
          </div>

          {/* Customer Segment Breakdown & Revenue Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" /> Customer Composition
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Individual Walk-ins</span>
                    <span className="font-mono">65% (142 customers)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>Fleet Accounts</span>
                    <span className="font-mono">22% (48 accounts)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '22%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>VIP Preferred</span>
                    <span className="font-mono">13% (28 members)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '13%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" /> Revenue Contribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border">
                  <div>
                    <p className="text-xs font-semibold">Fleet Accounts</p>
                    <p className="text-[11px] text-muted-foreground">High frequency, recurring maintenance</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-emerald-700">54% Revenue</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border">
                  <div>
                    <p className="text-xs font-semibold">VIP Individuals</p>
                    <p className="text-[11px] text-muted-foreground">High average ticket price per service</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-purple-700">28% Revenue</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border">
                  <div>
                    <p className="text-xs font-semibold">Standard Walk-ins</p>
                    <p className="text-[11px] text-muted-foreground">One-off repairs and oil changes</p>
                  </div>
                  <span className="text-sm font-bold font-mono text-blue-700">18% Revenue</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Spending Customers Table */}
          <div className="p-5 rounded-xl border bg-white" style={{ borderColor: 'hsl(45 15% 88%)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Top Spending Customers
              </h3>
              <span className="text-xs text-muted-foreground">Lifetime Revenue</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground font-mono uppercase text-[10px]">
                    <th className="py-2 px-3">Customer Name</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Vehicles</th>
                    <th className="py-2 px-3">Total Spend</th>
                    <th className="py-2 px-3">Retention Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topCustomers.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{c.name}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {c.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{c.vehicles}</td>
                      <td className="py-2.5 px-3 font-bold font-mono text-emerald-700">{c.spent}</td>
                      <td className="py-2.5 px-3 font-mono">{c.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t bg-slate-50">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: 'hsl(84 25% 30%)' }}>
            Close Reports
          </button>
        </div>
      </div>
    </div>
  );
}
