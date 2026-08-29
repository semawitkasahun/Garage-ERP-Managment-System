import { useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, X } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useFinanceTransactions } from '../hooks/useFinance';

export function TransactionsPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);

  const [search, setSearch] = useState('');
  const [account, setAccount] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useFinanceTransactions({
    search,
    account,
    type,
    page,
    per_page: 15
  });

  const transactions = data?.data || [];
  const totalPages = data?.last_page || 1;

  const handleResetFilters = () => {
    setSearch('');
    setAccount('');
    setType('');
    setPage(1);
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Financial Transactions" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        
        {/* Filters Panel */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search transactions..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-emerald-600"
              />
            </div>

            {/* Account Select */}
            <select
              value={account}
              onChange={(e) => { setAccount(e.target.value); setPage(1); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              <option value="">All Accounts</option>
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>

            {/* Type Select */}
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              <option value="">All Types</option>
              <option value="deposit">Deposit/Income</option>
              <option value="withdrawal">Withdrawal/Expense</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
            </select>

            {/* Reset Filters */}
            {(search || account || type) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1"
              >
                <X className="h-3.5 w-3.5" /> Clear Filters
              </button>
            )}
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground bg-background hover:bg-muted font-semibold transition-colors disabled:opacity-55"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Transactions Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Date</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Description</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Source</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Type</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Account</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground text-right">Amount</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-700"></div>
                        <span>Loading transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                      No financial transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isExpense = ['withdrawal', 'transfer_out'].includes(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-foreground">{tx.description}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {tx.reference_type ? (
                            <span className="capitalize px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono text-[10px] font-semibold border border-border">
                              {tx.reference_type.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isExpense ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isExpense ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            {tx.type === 'deposit' ? 'Income' : tx.type === 'withdrawal' ? 'Expense' : tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 capitalize text-muted-foreground whitespace-nowrap">{tx.account}</td>
                        <td className={`px-5 py-3.5 text-right font-display font-bold whitespace-nowrap ${isExpense ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isExpense ? '-' : '+'}ETB {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                            Completed
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-4 bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground bg-background hover:bg-muted font-semibold disabled:opacity-55"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-foreground bg-background hover:bg-muted font-semibold disabled:opacity-55"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
