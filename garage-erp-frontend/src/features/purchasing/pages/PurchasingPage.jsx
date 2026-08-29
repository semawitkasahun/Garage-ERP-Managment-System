import { useState } from 'react';
import { 
  ShoppingCart, 
  Truck, 
  Plus, 
  Search, 
  Calendar, 
  Eye, 
  Trash2, 
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';

import { usePurchasesList, usePurchaseSummary, useDeletePurchase } from '../hooks/usePurchases';
import { useSuppliersList } from '../hooks/useSuppliers';

import { NewPurchaseModal } from '../components/NewPurchaseModal';
import { AddSupplierModal } from '../components/AddSupplierModal';
import { PurchaseDetailModal } from '../components/PurchaseDetailModal';
import { SupplierDetailModal } from '../components/SupplierDetailModal';

export function PurchasingPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);

  // Tabs state
  const [activeTab, setActiveTab] = useState('purchases');

  // Modals state
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // Filter/Search/Sort state
  const [searchPurchase, setSearchPurchase] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [fromDateFilter, setFromDateFilter] = useState('');
  const [toDateFilter, setToDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const [searchSupplier, setSearchSupplier] = useState('');

  // Fetch summary statistics
  const { data: summary, isLoading: isSummaryLoading } = usePurchaseSummary();

  // Fetch purchases list
  const { data: purchasesData, isLoading: isPurchasesLoading } = usePurchasesList({
    search: searchPurchase,
    supplier_id: supplierFilter,
    payment_status: paymentFilter,
    from_date: fromDateFilter,
    to_date: toDateFilter,
    sort: sortOrder
  });
  const purchases = purchasesData?.data ?? [];

  // Fetch suppliers list
  const { data: suppliersData, isLoading: isSuppliersLoading } = useSuppliersList({
    search: searchSupplier,
    per_page: 100
  });
  const suppliers = suppliersData?.data ?? [];

  // Delete purchase mutation
  const deletePurchase = useDeletePurchase();

  const handleDeletePurchase = async (id, number) => {
    if (window.confirm(`Are you sure you want to delete purchase record ${number}? This action cannot be undone.`)) {
      try {
        await deletePurchase.mutateAsync(id);
        toast.success(`Purchase ${number} deleted successfully.`);
      } catch (err) {
        toast.error(err.response?.data?.message ?? 'Failed to delete purchase.');
      }
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-xs font-semibold uppercase">Paid</span>;
      case 'partial':
        return <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-xs font-semibold uppercase">Partial</span>;
      case 'unpaid':
      default:
        return <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-xs font-semibold uppercase">Unpaid</span>;
    }
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Purchasing & Suppliers" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        
        {/* Page Subtitle & Action buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted-foreground">Manage suppliers and keep a clear record of all purchases.</p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewPurchaseOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-opacity-95 transition-all"
              style={{ background: 'hsl(84 25% 30%)' }}
            >
              <Plus className="h-4 w-4" /> New Purchase
            </button>
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Supplier
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Suppliers</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">
                {isSummaryLoading ? '...' : summary?.total_suppliers ?? 0}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
              <Building className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Suppliers</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">
                {isSummaryLoading ? '...' : summary?.active_suppliers ?? 0}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchases This Month</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">
                {isSummaryLoading ? '...' : summary?.purchases_this_month ?? 0}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Unpaid Purchases</p>
              <h3 className="text-2xl font-bold mt-1 text-rose-700">
                {isSummaryLoading ? '...' : summary?.unpaid_purchases ?? 0}
              </h3>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'purchases'
                ? 'border-slate-800 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingCart className="h-4 w-4" /> Purchases
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'suppliers'
                ? 'border-slate-800 text-slate-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Truck className="h-4 w-4" /> Suppliers
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'purchases' ? (
          <div className="space-y-4">
            {/* Purchase Search, Filter, Sort Controls */}
            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by Purchase #, Supplier name, item name..."
                    value={searchPurchase}
                    onChange={(e) => setSearchPurchase(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                {/* Supplier select */}
                <div>
                  <select
                    value={supplierFilter}
                    onChange={(e) => setSupplierFilter(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status select */}
                <div>
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">All Payment Status</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              {/* Date Filters & Sorting */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date Range:</span>
                  <input
                    type="date"
                    value={fromDateFilter}
                    onChange={(e) => setFromDateFilter(e.target.value)}
                    className="rounded border border-input px-2 py-1 outline-none"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={toDateFilter}
                    onChange={(e) => setToDateFilter(e.target.value)}
                    className="rounded border border-input px-2 py-1 outline-none"
                  />
                  {(fromDateFilter || toDateFilter) && (
                    <button
                      onClick={() => { setFromDateFilter(''); setToDateFilter(''); }}
                      className="text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1"><SlidersHorizontal className="h-3.5 w-3.5" /> Sort By:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="rounded border border-input px-2 py-1 outline-none bg-white font-semibold text-slate-700"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="highest_amount">Highest Amount</option>
                    <option value="lowest_amount">Lowest Amount</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Purchases Table */}
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {['Purchase #', 'Supplier', 'Purchase Date', 'Items', 'Total Amount', 'Payment Status', 'Actions'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isPurchasesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading purchases...
                      </td>
                    </tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center italic text-muted-foreground">
                        No purchases found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((purchase) => (
                      <tr key={purchase.purchase_id} className="border-b border-border last:border-0 hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelectedPurchaseId(purchase.purchase_id)}
                            className="font-mono font-bold text-sky-600 hover:underline"
                          >
                            {purchase.purchase_number}
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-800">{purchase.supplier?.name}</div>
                          {purchase.invoice_reference && (
                            <span className="text-[10px] text-slate-400">Ref: {purchase.invoice_reference}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {purchase.items?.length || 0} item(s)
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          ETB {Number(purchase.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5">
                          {getPaymentBadge(purchase.payment_status)}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPurchaseId(purchase.purchase_id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {purchase.payment_status === 'unpaid' && (
                              <button
                                type="button"
                                onClick={() => handleDeletePurchase(purchase.purchase_id, purchase.purchase_number)}
                                className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Supplier Search Bar */}
            <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-xl flex items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search suppliers by name, contact, email..."
                  value={searchSupplier}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                  className="w-full rounded-lg border border-input bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Suppliers Table */}
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {['Supplier Name', 'Contact Person', 'Phone', 'Email', 'Address', 'Status', 'Action'].map((h) => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isSuppliersLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading suppliers...
                      </td>
                    </tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center italic text-muted-foreground">
                        No suppliers found.
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.supplier_id} className="border-b border-border last:border-0 hover:bg-slate-50/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelectedSupplierId(supplier.supplier_id)}
                            className="font-bold text-slate-800 hover:underline hover:text-sky-600 text-left"
                          >
                            {supplier.name}
                          </button>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{supplier.contact_person ?? '—'}</td>
                        <td className="px-4 py-3.5 text-slate-600">{supplier.phone ?? '—'}</td>
                        <td className="px-4 py-3.5 text-slate-600">{supplier.email ?? '—'}</td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs max-w-xs truncate">{supplier.address ?? '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            supplier.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {supplier.status ?? 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSupplierId(supplier.supplier_id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" /> View details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal components */}
        <NewPurchaseModal 
          open={isNewPurchaseOpen} 
          onClose={() => setIsNewPurchaseOpen(false)} 
        />

        <AddSupplierModal 
          open={isAddSupplierOpen} 
          onClose={() => setIsAddSupplierOpen(false)} 
        />

        <PurchaseDetailModal 
          open={!!selectedPurchaseId} 
          purchaseId={selectedPurchaseId} 
          onClose={() => setSelectedPurchaseId(null)} 
        />

        <SupplierDetailModal 
          open={!!selectedSupplierId} 
          supplierId={selectedSupplierId} 
          onClose={() => setSelectedSupplierId(null)} 
          onViewPurchase={(purchaseId) => {
            setSelectedSupplierId(null);
            setSelectedPurchaseId(purchaseId);
          }}
        />

      </div>
    </DashboardLayout>
  );
}
