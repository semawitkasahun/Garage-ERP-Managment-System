import { useState } from 'react';
import { 
  Plus, Search, Edit3, Trash2, Eye, 
  CheckCircle2, CreditCard, XCircle, AlertCircle, RefreshCw 
} from 'lucide-react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { getNavSections } from '@/layouts/navSections';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/http/axios';
import { 
  useExpenses, useCreateExpense, useUpdateExpense, 
  useDeleteExpense, useApproveExpense, usePayExpense 
} from '../hooks/useFinance';

const EXPENSE_CATEGORIES = [
  'Rent',
  'Electricity',
  'Water',
  'Internet',
  'Fuel',
  'Cleaning',
  'Office Supplies',
  'Equipment Repair',
  'Transportation',
  'Maintenance',
  'Other'
];

export function ExpensesPage() {
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);

  // States
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'view'
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Form State
  const [form, setForm] = useState({
    category: 'Rent',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    reference_no: '',
    supplier_id: '',
    notes: '',
  });

  // Query & Mutations
  const { data: expensesData, isLoading, refetch } = useExpenses({
    category: categoryFilter,
    status: statusFilter,
    page,
    per_page: 15
  });

  // Fetch suppliers list for the dropdown
  const { data: suppliersList = [] } = useQuery({
    queryKey: ['finance-suppliers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers', { params: { per_page: 100 } });
      return res.data?.data || res.data || [];
    }
  });

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const approveExpense = useApproveExpense();
  const payExpense = usePayExpense();

  const expenses = expensesData?.data || [];
  const totalPages = expensesData?.last_page || 1;

  // Handlers
  const handleOpenAddModal = () => {
    setForm({
      category: 'Rent',
      amount: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      reference_no: '',
      supplier_id: '',
      notes: '',
    });
    setActiveModal('add');
  };

  const handleOpenEditModal = (expense) => {
    setSelectedExpense(expense);
    setForm({
      category: expense.category || 'Rent',
      amount: expense.amount || '',
      description: expense.description || '',
      expense_date: expense.expense_date ? expense.expense_date.split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: expense.payment_method || 'cash',
      reference_no: expense.reference_no || '',
      supplier_id: expense.supplier_id || '',
      notes: expense.notes || '',
    });
    setActiveModal('edit');
  };

  const handleOpenViewModal = (expense) => {
    setSelectedExpense(expense);
    setActiveModal('view');
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      branch_id: user?.branch_id || 1, // fallback to branch 1
      status: 'pending', // reset to pending on creation/edit unless already approved
    };

    try {
      if (activeModal === 'add') {
        await createExpense.mutateAsync(payload);
      } else {
        await updateExpense.mutateAsync({ id: selectedExpense.expense_id, data: payload });
      }
      setActiveModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expense.');
    }
  };

  const handleDelete = async (expense) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpense.mutateAsync(expense.expense_id);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense.');
    }
  };

  const handleApprove = async (expense) => {
    if (!confirm('Approve this expense request?')) return;
    try {
      await approveExpense.mutateAsync({
        id: expense.expense_id,
        data: { approved_by: user?.user_id }
      });
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve expense.');
    }
  };

  const handlePay = async (expense) => {
    if (!confirm('Record payment for this expense? This will withdraw funds from cash/bank.')) return;
    try {
      await payExpense.mutateAsync(expense.expense_id);
      refetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payment.');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'paid':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 capitalize">Paid</span>;
      case 'approved':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-600 capitalize">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-50 text-red-600 capitalize">Rejected</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-600 capitalize">Pending</span>;
    }
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Expense Management" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        
        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Expense
          </button>
        </div>

        {/* Expenses List */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Date</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Category</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Description</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Payment Method</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Ref No.</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Amount</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground">Status</th>
                  <th className="px-5 py-3 font-mono text-[10px] tracking-wider uppercase text-muted-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-700"></div>
                        <span>Loading operating expenses...</span>
                      </div>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
                      No operating expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.expense_id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {exp.expense_date ? new Date(exp.expense_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground whitespace-nowrap">{exp.category}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{exp.description || '—'}</td>
                      <td className="px-5 py-3.5 capitalize text-muted-foreground whitespace-nowrap">{exp.payment_method || 'Cash'}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">{exp.reference_no || '—'}</td>
                      <td className="px-5 py-3.5 font-display font-bold text-foreground whitespace-nowrap">
                        ETB {parseFloat(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{getStatusBadge(exp.status)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="View details"
                            onClick={() => handleOpenViewModal(exp)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {/* Pending state actions: Edit, Approve, Delete */}
                          {exp.status === 'pending' && (
                            <>
                              <button
                                title="Edit"
                                onClick={() => handleOpenEditModal(exp)}
                                className="p-1.5 rounded-lg border border-border text-emerald-700 hover:bg-emerald-50 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                title="Approve"
                                onClick={() => handleApprove(exp)}
                                className="p-1.5 rounded-lg border border-border text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => handleDelete(exp)}
                                className="p-1.5 rounded-lg border border-border text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* Approved state action: Pay */}
                          {exp.status === 'approved' && (
                            <button
                              title="Record Payment"
                              onClick={() => handlePay(exp)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs font-semibold"
                            >
                              <CreditCard className="h-3.5 w-3.5" /> Pay
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

      {/* Add / Edit Modal */}
      {activeModal && activeModal !== 'view' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border bg-muted/20">
              <h3 className="font-display text-base font-semibold text-foreground">
                {activeModal === 'add' ? 'Record New Operating Expense' : 'Edit Expense Details'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveSubmit}>
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Expense Date */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={form.expense_date}
                      onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    >
                      {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Amount (ETB)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter amount"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Enter brief description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Payment Method</label>
                    <select
                      value={form.payment_method}
                      onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>

                  {/* Reference No */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Receipt/Ref No.</label>
                    <input
                      type="text"
                      placeholder="e.g. RCP-10492"
                      value={form.reference_no}
                      onChange={(e) => setForm({ ...form, reference_no: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Optional Supplier */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Supplier / Vendor (Optional)</label>
                  <select
                    value={form.supplier_id}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600"
                  >
                    <option value="">Select Vendor</option>
                    {suppliersList.map(s => (
                      <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Additional Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Enter notes..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-emerald-600 resize-none"
                  />
                </div>
              </div>

              <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 bg-muted/10">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm text-foreground bg-background hover:bg-muted font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpense.isPending || updateExpense.isPending}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm disabled:opacity-55"
                >
                  {createExpense.isPending || updateExpense.isPending ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {activeModal === 'view' && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">Expense Details</h3>
              {getStatusBadge(selectedExpense.status)}
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Expense Date</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {selectedExpense.expense_date ? new Date(selectedExpense.expense_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Category</p>
                  <p className="text-sm font-semibold mt-0.5">{selectedExpense.category}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Amount</p>
                <p className="text-lg font-bold mt-0.5 text-foreground">
                  ETB {parseFloat(selectedExpense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Description</p>
                <p className="text-sm text-foreground mt-0.5">{selectedExpense.description || '—'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-semibold mt-0.5 capitalize">{selectedExpense.payment_method || 'Cash'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Reference No.</p>
                  <p className="text-sm font-semibold mt-0.5 font-mono">{selectedExpense.reference_no || '—'}</p>
                </div>
              </div>

              {selectedExpense.supplier && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Supplier / Vendor</p>
                  <p className="text-sm text-foreground mt-0.5">{selectedExpense.supplier.name}</p>
                </div>
              )}

              {selectedExpense.notes && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Additional Notes</p>
                  <p className="text-sm text-muted-foreground mt-0.5 bg-muted/30 p-2.5 rounded-lg border border-border">{selectedExpense.notes}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end bg-muted/10">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-foreground bg-background hover:bg-muted font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
