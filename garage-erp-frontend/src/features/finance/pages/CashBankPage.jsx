import { useState } from 'react';
import { Plus, Wallet, Landmark, ArrowUpRight, ArrowDownRight, ArrowRightLeft, X } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useCashBank, useRecordCashBank } from '../hooks/useFinance';

export function CashBankPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);

  const [accountFilter, setAccountFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'deposit',
    account: 'cash',
    from_account: 'cash',
    amount: '',
  });

  const { data, isLoading } = useCashBank({ account: accountFilter, page, per_page: 15 });
  const recordTx = useRecordCashBank();

  const cashBalance = parseFloat(data?.cash_balance ?? 0);
  const bankBalance = parseFloat(data?.bank_balance ?? 0);
  const availableFunds = parseFloat(data?.available_funds ?? 0);
  const history = data?.history?.data || [];
  const totalPages = data?.history?.last_page || 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      transaction_date: form.transaction_date,
      description: form.description,
      type: form.type,
      amount: parseFloat(form.amount),
      ...(form.type === 'transfer' ? { from_account: form.from_account } : { account: form.account }),
    };
    try {
      await recordTx.mutateAsync(payload);
      setShowModal(false);
      setForm({ transaction_date: new Date().toISOString().split('T')[0], description: '', type: 'deposit', account: 'cash', from_account: 'cash', amount: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record transaction.');
    }
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Cash & Bank" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">

        {/* Balance Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Cash Balance</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Wallet className="h-4 w-4" /></div>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              ETB {cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Bank Balance</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600"><Landmark className="h-4 w-4" /></div>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              ETB {bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Total Available Funds</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700"><ArrowRightLeft className="h-4 w-4" /></div>
            </div>
            <p className="font-display text-2xl font-bold text-emerald-700">
              ETB {availableFunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Actions + Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <select
            value={accountFilter}
            onChange={(e) => { setAccountFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
          >
            <option value="">All Accounts</option>
            <option value="cash">Cash Only</option>
            <option value="bank">Bank Only</option>
          </select>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" /> Record Transaction
          </button>
        </div>

        {/* Transaction History Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/20">
            <h3 className="font-display text-sm font-semibold text-foreground">Transaction History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Date</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Description</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Type</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Account</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Source</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No transactions recorded yet.</td></tr>
                ) : (
                  history.map((tx) => {
                    const isOut = ['withdrawal', 'transfer_out'].includes(tx.type);
                    return (
                      <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-foreground">{tx.description}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {isOut ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            {tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 capitalize text-muted-foreground">{tx.account}</td>
                        <td className="px-5 py-3.5">
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-muted rounded border border-border text-muted-foreground">
                            {tx.reference_type || 'manual'}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 text-right font-display font-bold whitespace-nowrap ${isOut ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {isOut ? '-' : '+'}ETB {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-muted/10">
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-55 hover:bg-muted">Previous</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-55 hover:bg-muted">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">Record Cash/Bank Transaction</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Transaction Date</label>
                  <input type="date" required value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Description</label>
                  <input type="text" required placeholder="Describe the transaction" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Transaction Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600">
                    <option value="deposit">Cash/Bank Received (Deposit)</option>
                    <option value="withdrawal">Cash/Bank Payment (Withdrawal)</option>
                    <option value="transfer">Transfer (Cash ↔ Bank)</option>
                  </select>
                </div>
                {form.type !== 'transfer' ? (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Account</label>
                    <select value={form.account} onChange={e => setForm({ ...form, account: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600">
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Transfer From</label>
                    <select value={form.from_account} onChange={e => setForm({ ...form, from_account: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600">
                      <option value="cash">Cash → Bank</option>
                      <option value="bank">Bank → Cash</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Amount (ETB)</label>
                  <input type="number" step="0.01" required min="0.01" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600" />
                </div>
              </div>
              <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground bg-background hover:bg-muted font-semibold">Cancel</button>
                <button type="submit" disabled={recordTx.isPending} className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-55">
                  {recordTx.isPending ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
