import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, TrendingUp, TrendingDown, Users, 
  Truck, Wallet, Landmark, ArrowUpRight, ArrowDownRight, 
  ArrowRightLeft, AlertCircle, RefreshCw, Calendar
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useFinanceDashboard } from '../hooks/useFinance';

export function FinanceDashboard() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);
  
  const { data, isLoading, isError, refetch } = useFinanceDashboard();

  if (isLoading) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Finance Dashboard" roleLabel={user?.username ?? 'Staff'}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
          <span className="ml-3 text-sm text-muted-foreground">Loading financial metrics...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout navSections={navSections} pageTitle="Finance Dashboard" roleLabel={user?.username ?? 'Staff'}>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>Failed to load financial metrics. Please check server connections.</span>
          <button onClick={() => refetch()} className="ml-auto flex items-center gap-1.5 text-sm underline font-semibold">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const { metrics, recent_transactions = [] } = data;

  const cardConfig = [
    { label: 'Total Income', value: metrics.total_income, icon: TrendingUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Total Expenses', value: metrics.total_expenses, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Net Profit', value: metrics.net_profit, icon: DollarSign, color: metrics.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600', bg: metrics.net_profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50' },
    { label: 'Accounts Receivable', value: metrics.accounts_receivable, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', link: '/finance/receivables' },
    { label: 'Accounts Payable', value: metrics.accounts_payable, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50', link: '/finance/payables' },
    { label: 'Cash Balance', value: metrics.cash_balance, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/finance/cash-bank' },
    { label: 'Bank Balance', value: metrics.bank_balance, icon: Landmark, color: 'text-purple-600', bg: 'bg-purple-50', link: '/finance/cash-bank' },
    { label: "This Month's Income", value: metrics.this_month_income, icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: "This Month's Expenses", value: metrics.this_month_expenses, icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  return (
    <DashboardLayout navSections={navSections} pageTitle="Finance Dashboard" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        
        {/* Header Summary Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cardConfig.map((c, i) => {
            const Icon = c.icon;
            const CardWrapper = c.link ? Link : 'div';
            return (
              <CardWrapper 
                key={i} 
                to={c.link}
                className={`block rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md ${c.link ? 'cursor-pointer hover:border-emerald-600/40 no-underline' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">{c.label}</span>
                  <div className={`p-2 rounded-lg ${c.bg} ${c.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                  ETB {parseFloat(c.value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {c.link && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 hover:text-emerald-700">
                    View details <ArrowRightLeft className="h-3 w-3" />
                  </p>
                )}
              </CardWrapper>
            );
          })}
        </div>

        {/* Recent Activities Section */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">Recent Financial Transactions</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Unified ledger of customer payments, operating expenses, and payroll.</p>
            </div>
            <Link to="/finance/transactions" className="text-xs font-semibold text-emerald-700 hover:underline">
              View all transactions
            </Link>
          </div>

          {recent_transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-border rounded-xl">
              <DollarSign className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-sm text-foreground mt-2">No recent transactions recorded</p>
              <p className="text-xs text-muted-foreground">Transactions from sales, purchasing, payroll and manual entry will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recent_transactions.map((tx) => {
                const isExpense = ['withdrawal', 'transfer_out'].includes(tx.type);
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isExpense ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        {isExpense ? <ArrowDownRight className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="font-mono">{new Date(tx.transaction_date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.account}</span>
                          {tx.reference_type && (
                            <>
                              <span>•</span>
                              <span className="capitalize px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">
                                {tx.reference_type.replace('_', ' ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-display text-sm font-bold ${isExpense ? 'text-red-600' : 'text-emerald-700'}`}>
                        {isExpense ? '-' : '+'}ETB {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
