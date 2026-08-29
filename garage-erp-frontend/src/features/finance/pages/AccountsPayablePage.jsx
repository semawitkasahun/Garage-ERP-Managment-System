import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowRightLeft } from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { usePayables } from '../hooks/useFinance';

export function AccountsPayablePage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePayables({ page, per_page: 15 });
  const payables = data?.data || [];
  const totalPages = data?.last_page || 1;

  const getStatusBadge = (status) => {
    const colors = { paid: 'bg-emerald-50 text-emerald-700', partial: 'bg-amber-50 text-amber-600', unpaid: 'bg-red-50 text-red-600' };
    const s = (status || 'unpaid').toLowerCase();
    return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${colors[s] || 'bg-muted text-muted-foreground'}`}>{s}</span>;
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Accounts Payable" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4 text-amber-600" />
            <span>Showing supplier purchases with outstanding balances. Payments recorded in <strong>Purchasing</strong> automatically update these balances.</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Supplier</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Purchase #</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Purchase Date</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground text-right">Total</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground text-right">Paid</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground text-right">Balance Due</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Status</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">Loading payables...</td></tr>
                ) : payables.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center">
                      <p className="font-medium text-foreground">No outstanding payables</p>
                      <p className="text-xs text-muted-foreground mt-1">All supplier purchases have been settled.</p>
                    </td>
                  </tr>
                ) : (
                  payables.map((purchase) => {
                    const balance = parseFloat(purchase.total_amount) - parseFloat(purchase.amount_paid);
                    return (
                      <tr key={purchase.purchase_id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-foreground">{purchase.supplier?.name || '—'}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{purchase.purchase_number}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                          ETB {parseFloat(purchase.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold">
                          ETB {parseFloat(purchase.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-amber-600">
                          ETB {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-5 py-3.5">{getStatusBadge(purchase.payment_status)}</td>
                        <td className="px-5 py-3.5">
                          <Link to="/purchasing" className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline">
                            <ArrowRightLeft className="h-3.5 w-3.5" /> Open in Purchasing
                          </Link>
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
    </DashboardLayout>
  );
}
