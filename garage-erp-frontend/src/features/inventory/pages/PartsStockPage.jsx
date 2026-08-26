import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, AlertTriangle, XCircle, Search, RefreshCw, Plus, Edit3, Eye, 
  ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle, Sparkles, Filter, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getNavSections } from '@/layouts/navSections';
import apiClient from '@/services/http/axios';
import { useQuery } from '@tanstack/react-query';

const CATEGORIES = [
  'Engine Oil',
  'Filters',
  'Brake Pads',
  'Spark Plugs',
  'Coolants & Fluids',
  'Tires',
  'Suspension Parts',
  'Electrical Parts',
  'Other'
];

export function PartsStockPage() {
  const navigate = useNavigate();
  const { user, role } = useAuthStore();
  const navSections = getNavSections(role);

  // Alert/Toast State
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'addItem' | 'editItem' | 'viewItem' | 'receiveStock' | 'issueParts'
  const [selectedItem, setSelectedItem] = useState(null);

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [page, setPage] = useState(1);

  // Form States
  const [itemForm, setItemForm] = useState({
    sku: '', name: '', part_number: '', category: 'Engine Oil', unit_of_measure: 'pcs',
    cost_price: '', sell_price: '', reorder_point: '5', storage_location: '', supplier_id: '', description: ''
  });
  
  const [receiveStockForm, setReceiveStockForm] = useState({ item_id: '', quantity: '1', unit_cost: '', notes: '' });
  const [issuePartsForm, setIssuePartsForm] = useState({ item_id: '', job_card_id: '', quantity: '1', notes: '' });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Fetch Parts/Inventory Items
  const { data: partsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['parts-list', page, search, category, status, locationFilter, supplierFilter],
    queryFn: async () => {
      const res = await apiClient.get('/inventory-items', {
        params: {
          page,
          search,
          category,
          status,
          storage_location: locationFilter,
          supplier_id: supplierFilter,
          per_page: 15
        }
      });
      return res.data;
    }
  });

  // Fetch Suppliers for form dropdowns
  const { data: suppliersList = [] } = useQuery({
    queryKey: ['suppliers-dropdown-list'],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers', { params: { per_page: 100 } });
      return res.data?.data || res.data || [];
    }
  });

  // Fetch Full Details of selected item (for view details modal)
  const { data: itemDetails } = useQuery({
    queryKey: ['item-details', selectedItem?.item_id],
    queryFn: async () => {
      if (!selectedItem?.item_id) return null;
      const res = await apiClient.get(`/inventory-items/${selectedItem.item_id}`);
      return res.data;
    },
    enabled: !!selectedItem?.item_id && activeModal === 'viewItem'
  });

  const parts = partsData?.data || [];
  const totalPages = partsData?.last_page || 1;

  // Handlers
  const handleAddItem = () => {
    setItemForm({
      sku: `SKU-${Date.now().toString().slice(-6)}`, name: '', part_number: '', category: 'Engine Oil', unit_of_measure: 'pcs',
      cost_price: '', sell_price: '', reorder_point: '5', storage_location: '', supplier_id: '', description: ''
    });
    setActiveModal('addItem');
  };

  const handleEditItem = (item) => {
    setSelectedItem(item);
    setItemForm({
      sku: item.sku || '',
      name: item.name || '',
      part_number: item.part_number || '',
      category: item.category || 'Engine Oil',
      unit_of_measure: item.unit_of_measure || 'pcs',
      cost_price: item.cost_price || '',
      sell_price: item.sell_price || '',
      reorder_point: item.reorder_point || '5',
      storage_location: item.storage_location || '',
      supplier_id: item.supplier_id || '',
      description: item.description || ''
    });
    setActiveModal('editItem');
  };

  const handleViewItem = (item) => {
    setSelectedItem(item);
    setActiveModal('viewItem');
  };

  const handleSaveItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.sku) {
      showToast('Name and SKU are required.', 'error');
      return;
    }
    setSubmittingAction(true);
    try {
      if (activeModal === 'addItem') {
        await apiClient.post('/inventory-items', {
          ...itemForm,
          cost_price: parseFloat(itemForm.cost_price) || 0,
          sell_price: parseFloat(itemForm.sell_price) || 0,
          reorder_point: parseFloat(itemForm.reorder_point) || 5,
          supplier_id: itemForm.supplier_id ? Number(itemForm.supplier_id) : null
        });
        showToast(`Part "${itemForm.name}" created successfully.`);
      } else {
        await apiClient.patch(`/inventory-items/${selectedItem.item_id}`, {
          ...itemForm,
          cost_price: parseFloat(itemForm.cost_price) || 0,
          sell_price: parseFloat(itemForm.sell_price) || 0,
          reorder_point: parseFloat(itemForm.reorder_point) || 5,
          supplier_id: itemForm.supplier_id ? Number(itemForm.supplier_id) : null
        });
        showToast(`Part "${itemForm.name}" updated successfully.`);
      }
      setActiveModal(null);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save inventory item.', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReceiveStockSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      await apiClient.post('/inventory-dashboard/receive-stock', {
        item_id: Number(receiveStockForm.item_id),
        quantity: parseFloat(receiveStockForm.quantity) || 1,
        unit_cost: receiveStockForm.unit_cost ? parseFloat(receiveStockForm.unit_cost) : null,
        notes: receiveStockForm.notes || 'Documented stock receipt'
      });
      showToast('Stock received and quantity updated.');
      setActiveModal(null);
      setReceiveStockForm({ item_id: '', quantity: '1', unit_cost: '', notes: '' });
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to receive stock.', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleIssuePartsSubmit = async (e) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      await apiClient.post('/inventory-dashboard/issue-parts', {
        item_id: Number(issuePartsForm.item_id),
        job_card_id: issuePartsForm.job_card_id ? Number(issuePartsForm.job_card_id) : null,
        quantity: parseFloat(issuePartsForm.quantity) || 1,
        notes: issuePartsForm.notes || 'Documented stock issue'
      });
      showToast('Stock issued successfully.');
      setActiveModal(null);
      setIssuePartsForm({ item_id: '', job_card_id: '', quantity: '1', notes: '' });
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to issue parts.', 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helper to determine status and colors
  const getStatusBadge = (item) => {
    const qty = item.stock ? item.stock.sum('quantity_on_hand') : (item.quantity_on_hand || 0);
    const reorder = parseFloat(item.reorder_point || 0);
    
    if (!item.is_active) {
      return <span className="bg-gray-100 text-gray-800 font-bold px-2 py-0.5 rounded text-[10px]">Inactive</span>;
    }
    if (qty <= 0) {
      return <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">Out of Stock</span>;
    }
    if (qty <= reorder) {
      return <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">Low Stock</span>;
    }
    return <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">In Stock</span>;
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Parts & Consumables Stock" roleLabel={user?.username ?? 'Staff'}>
      <div className="space-y-6">
        {/* Toast Alert Notice */}
        {toast && (
          <div className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-700 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              <span className="text-sm font-semibold">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="opacity-80 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parts & Consumables Stock</h1>
            <p className="text-sm text-muted-foreground">
              Manage parts catalog, search inventory positions, track storage locations, and document stock transactions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setReceiveStockForm(prev => ({ ...prev, item_id: '' }));
                setActiveModal('receiveStock');
              }}
              variant="outline"
              size="sm"
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            >
              <ArrowDownLeft className="w-4 h-4 mr-1.5 text-emerald-600" />
              Receive Stock
            </Button>
            <Button
              onClick={() => {
                setIssuePartsForm(prev => ({ ...prev, item_id: '' }));
                setActiveModal('issueParts');
              }}
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5 text-amber-600" />
              Issue Parts
            </Button>
            <Button
              onClick={handleAddItem}
              style={{ background: 'hsl(84 25% 30%)' }}
              size="sm"
              className="text-white font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Consumable Part
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search SKU, name, part number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 border rounded bg-background px-2 text-xs"
              >
                <option value="">-- All Categories --</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-9 border rounded bg-background px-2 text-xs"
              >
                <option value="">-- All Statuses --</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <Input
                placeholder="Filter by Storage Location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full h-9 border rounded bg-background px-2 text-xs"
              >
                <option value="">-- All Suppliers --</option>
                {suppliersList.map(sup => (
                  <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Consumables Catalog Table */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-left">Item Code</th>
                    <th className="px-4 py-3 text-left">Part Name</th>
                    <th className="px-4 py-3 text-left">Part Number</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-right">Current Stock</th>
                    <th className="px-4 py-3 text-left">Unit</th>
                    <th className="px-4 py-3 text-right">Min Stock</th>
                    <th className="px-4 py-3 text-right">Unit Cost</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Supplier</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Loading parts inventory...
                      </td>
                    </tr>
                  ) : parts.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-muted-foreground italic">
                        No consumables or parts found in inventory matches search criteria.
                      </td>
                    </tr>
                  ) : (
                    parts.map((item) => {
                      const totalQty = item.stock ? item.stock.reduce((sum, s) => sum + parseFloat(s.quantity_on_hand || 0), 0) : (item.quantity_on_hand || 0);
                      return (
                        <tr key={item.item_id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-bold text-primary">{item.sku}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{item.name}</td>
                          <td className="px-4 py-3 font-mono text-muted-foreground">{item.part_number || 'N/A'}</td>
                          <td className="px-4 py-3">{item.category || 'General'}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold">{totalQty}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.unit_of_measure || 'pcs'}</td>
                          <td className="px-4 py-3 text-right font-mono text-muted-foreground">{parseFloat(item.reorder_point || 0)}</td>
                          <td className="px-4 py-3 text-right font-mono">
                            ETB {Number(item.cost_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">{item.storage_location || 'N/A'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.supplier?.name || 'N/A'}</td>
                          <td className="px-4 py-3">{getStatusBadge(item)}</td>
                          <td className="px-4 py-3 text-right space-x-1 whitespace-nowrap">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewItem(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditItem(item)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReceiveStockForm(prev => ({ ...prev, item_id: String(item.item_id) }));
                                setActiveModal('receiveStock');
                              }}
                              className="h-7 text-[10px] border-emerald-200 text-emerald-800 hover:bg-emerald-50 px-2"
                            >
                              + Stock
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-7 px-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-7 px-2"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MODAL 1: ADD & EDIT ITEM */}
        {(activeModal === 'addItem' || activeModal === 'editItem') && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border max-w-lg w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base">
                  {activeModal === 'addItem' ? 'Add Consumable Part' : 'Edit Consumable Part'}
                </h3>
                <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleSaveItemSubmit} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Part Name *</Label>
                    <Input
                      placeholder="e.g. Shell Helix Ultra 5W-40"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>SKU / Item Code *</Label>
                    <Input
                      placeholder="e.g. OIL-5W40-001"
                      value={itemForm.sku}
                      onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Part Number</Label>
                    <Input
                      placeholder="e.g. 5W40-5L-SHELL"
                      value={itemForm.part_number}
                      onChange={(e) => setItemForm({ ...itemForm, part_number: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      className="w-full h-9 border rounded bg-background px-2"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Unit of Measure</Label>
                    <Input
                      placeholder="e.g. L, pcs, box"
                      value={itemForm.unit_of_measure}
                      onChange={(e) => setItemForm({ ...itemForm, unit_of_measure: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Reorder Alert Level</Label>
                    <Input
                      type="number"
                      value={itemForm.reorder_point}
                      onChange={(e) => setItemForm({ ...itemForm, reorder_point: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Storage Location</Label>
                    <Input
                      placeholder="e.g. Shelf A-3"
                      value={itemForm.storage_location}
                      onChange={(e) => setItemForm({ ...itemForm, storage_location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>Unit Cost (ETB)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Cost price"
                      value={itemForm.cost_price}
                      onChange={(e) => setItemForm({ ...itemForm, cost_price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Sell Price (ETB)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Retail price"
                      value={itemForm.sell_price}
                      onChange={(e) => setItemForm({ ...itemForm, sell_price: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Primary Supplier</Label>
                    <select
                      value={itemForm.supplier_id}
                      onChange={(e) => setItemForm({ ...itemForm, supplier_id: e.target.value })}
                      className="w-full h-9 border rounded bg-background px-2"
                    >
                      <option value="">-- Select Supplier --</option>
                      {suppliersList.map(sup => (
                        <option key={sup.supplier_id} value={sup.supplier_id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <textarea
                    placeholder="Provide description or specifications..."
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full border rounded p-2 bg-background min-h-[60px]"
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                  <Button type="submit" disabled={submittingAction} style={{ background: 'hsl(84 25% 30%)' }} className="text-white">
                    {activeModal === 'addItem' ? 'Create Part' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: RECEIVE STOCK (Documented stock receipt transaction) */}
        {activeModal === 'receiveStock' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-1 text-emerald-800">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                  Document Stock Receipt
                </h3>
                <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleReceiveStockSubmit} className="space-y-3 text-xs">
                <div>
                  <Label>Part / Consumable Item *</Label>
                  <select
                    value={receiveStockForm.item_id}
                    onChange={(e) => setReceiveStockForm({ ...receiveStockForm, item_id: e.target.value })}
                    className="w-full h-9 border rounded bg-background px-2"
                    required
                  >
                    <option value="">-- Select Consumable --</option>
                    {parts.map(item => (
                      <option key={item.item_id} value={item.item_id}>{item.name} (SKU: {item.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Quantity to Add *</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={receiveStockForm.quantity}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>New Unit Cost (ETB)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={receiveStockForm.unit_cost}
                      onChange={(e) => setReceiveStockForm({ ...receiveStockForm, unit_cost: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Transaction Notes / GRN Reference *</Label>
                  <Input
                    placeholder="e.g. Received shipment from Supplier XYZ"
                    value={receiveStockForm.notes}
                    onChange={(e) => setReceiveStockForm({ ...receiveStockForm, notes: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                  <Button type="submit" disabled={submittingAction} style={{ background: 'hsl(84 25% 30%)' }} className="text-white">
                    Submit Transaction
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: ISSUE PARTS (Documented stock issue transaction) */}
        {activeModal === 'issueParts' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border max-w-md w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-1 text-amber-800">
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                  Document Stock Issue / Dispatch
                </h3>
                <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <form onSubmit={handleIssuePartsSubmit} className="space-y-3 text-xs">
                <div>
                  <Label>Part / Consumable Item *</Label>
                  <select
                    value={issuePartsForm.item_id}
                    onChange={(e) => setIssuePartsForm({ ...issuePartsForm, item_id: e.target.value })}
                    className="w-full h-9 border rounded bg-background px-2"
                    required
                  >
                    <option value="">-- Select Consumable --</option>
                    {parts.map(item => (
                      <option key={item.item_id} value={item.item_id}>{item.name} (SKU: {item.sku})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Quantity to Issue *</Label>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={issuePartsForm.quantity}
                      onChange={(e) => setIssuePartsForm({ ...issuePartsForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Job Card ID / Reference</Label>
                    <Input
                      placeholder="e.g. 5"
                      value={issuePartsForm.job_card_id}
                      onChange={(e) => setIssuePartsForm({ ...issuePartsForm, job_card_id: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Transaction Notes / Reason *</Label>
                  <Input
                    placeholder="e.g. Issued for job card oil change service"
                    value={issuePartsForm.notes}
                    onChange={(e) => setIssuePartsForm({ ...issuePartsForm, notes: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-3 border-t flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveModal(null)}>Cancel</Button>
                  <Button type="submit" disabled={submittingAction} style={{ background: 'hsl(84 25% 30%)' }} className="text-white">
                    Submit Dispatch
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: VIEW ITEM DETAILS */}
        {activeModal === 'viewItem' && selectedItem && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl border max-w-2xl w-full p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Consumable Details: {selectedItem.name}
                </h3>
                <button onClick={() => setActiveModal(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 border-r pr-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Part SKU</span>
                    <span className="font-mono text-base font-bold text-primary">{selectedItem.sku}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Part Number</span>
                    <span className="font-mono text-sm font-semibold">{selectedItem.part_number || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Category</span>
                    <span className="font-medium">{selectedItem.category || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Description</span>
                    <p className="text-muted-foreground">{selectedItem.description || 'No description provided.'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Unit Cost vs Sell Price</span>
                    <span className="font-mono">
                      Cost: ETB {Number(selectedItem.cost_price || 0).toLocaleString()} | Retail: ETB {Number(selectedItem.sell_price || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pl-2">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Storage Location</span>
                    <span className="font-medium text-foreground">{selectedItem.storage_location || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Primary Supplier</span>
                    <span>{selectedItem.supplier?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Stock Status</span>
                    <div className="mt-1">{getStatusBadge(selectedItem)}</div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg border border-border mt-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Stock Level Summary</span>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-card p-2 rounded border">
                        <span className="text-[10px] block text-muted-foreground">Quantity on Hand</span>
                        <span className="text-lg font-bold font-mono text-primary">
                          {selectedItem.stock ? selectedItem.stock.reduce((sum, s) => sum + parseFloat(s.quantity_on_hand || 0), 0) : (selectedItem.quantity_on_hand || 0)}
                        </span>
                      </div>
                      <div className="bg-card p-2 rounded border">
                        <span className="text-[10px] block text-muted-foreground">Minimum Threshold</span>
                        <span className="text-lg font-bold font-mono text-muted-foreground">
                          {parseFloat(selectedItem.reorder_point || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Stock Movements Logs */}
              {itemDetails?.movements && (
                <div className="space-y-2 border-t pt-4 text-xs">
                  <h4 className="font-bold text-xs uppercase text-muted-foreground tracking-wider">
                    Recent Stock Movements (Documented Transactions)
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-[11px]">
                      <thead className="bg-muted/50 font-semibold text-muted-foreground border-b">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-right">Quantity</th>
                          <th className="px-3 py-2 text-left">Transaction Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {itemDetails.movements.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-muted-foreground italic">
                              No recent stock transaction logs found for this item.
                            </td>
                          </tr>
                        ) : (
                          itemDetails.movements.map((move) => (
                            <tr key={move.movement_id || move.id}>
                              <td className="px-3 py-2 text-muted-foreground">
                                {new Date(move.created_at).toLocaleDateString()} {new Date(move.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-3 py-2">
                                {move.movement_type === 'in' ? (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Receipt</span>
                                ) : (
                                  <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">Issue</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold">
                                {move.movement_type === 'in' ? '+' : '-'}{parseFloat(move.quantity || 0)}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{move.notes || 'Manual Adjustment'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t flex justify-end gap-2 text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReceiveStockForm({ item_id: String(selectedItem.item_id), quantity: '1', unit_cost: '', notes: '' });
                    setActiveModal('receiveStock');
                  }}
                  className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                >
                  Document Receipt
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIssuePartsForm({ item_id: String(selectedItem.item_id), job_card_id: '', quantity: '1', notes: '' });
                    setActiveModal('issueParts');
                  }}
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                >
                  Document Issue
                </Button>
                <Button size="sm" onClick={() => setActiveModal(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
