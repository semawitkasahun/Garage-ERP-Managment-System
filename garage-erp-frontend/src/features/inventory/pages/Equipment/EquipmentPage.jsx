import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useEquipmentList,
  useEquipmentStats,
  useDeleteEquipment,
} from '@/hooks/useEquipment';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getNavSections } from '@/layouts/navSections';
import FilterBar from './components/FilterBar';
import EquipmentTable from './components/EquipmentTable';
import EquipmentFormModal from './components/EquipmentFormModal';
import EquipmentDetailDrawer from './components/EquipmentDetailDrawer';
import EquipmentQrPrintModal, { printQrLabels } from './components/EquipmentQrPrintModal';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Archive,
  RefreshCw,
  Printer,
  Plus,
  Boxes,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';

export function EquipmentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const navSections = getNavSections(user?.role);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    availability: '',
    condition: '',
    page: 1,
    per_page: 15,
  });

  // Modal States
  const [selectedEquipment, setSelectedEquipment] = useState(null); // For detail drawer
  const [formEquipment, setFormEquipment] = useState(undefined); // undefined = closed, null = new, object = edit
  const [qrModalEquipment, setQrModalEquipment] = useState(null); // For QR print modal

  // Queries & Mutations
  const { data: listData, isLoading, isFetching, refetch } = useEquipmentList(filters);
  const { data: statsData, refetch: refetchStats } = useEquipmentStats();
  const deleteMutation = useDeleteEquipment();

  const items = listData?.data || [];
  const meta = listData?.meta || {};

  // Database statistics
  const stats = statsData || {
    total: items.length,
    available: items.filter((i) => i.status === 'Available').length,
    checked_out: items.filter((i) => i.status === 'Checked Out').length,
    under_maintenance: items.filter(
      (i) => i.status === 'Under Maintenance' || i.status === 'Maintenance'
    ).length,
    damaged: items.filter((i) => i.status === 'Damaged').length,
    missing: items.filter((i) => i.status === 'Missing').length,
    retired: items.filter((i) => i.status === 'Retired').length,
    available_summary: items.filter((i) => i.status === 'Available').length,
    unavailable_summary: items.filter((i) => i.status !== 'Available').length,
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  const handleDelete = async (eq) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${eq.name} (${eq.equipment_code}) from the Equipment Registry?`
      )
    ) {
      await deleteMutation.mutateAsync(eq.id);
      handleRefresh();
    }
  };

  return (
    <DashboardLayout navSections={navSections} pageTitle="Equipment Registry" roleLabel={user?.username ?? 'Staff'}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Top Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Equipment Registry
                </h1>
                <p className="text-xs text-slate-500">
                  Permanent master database for garage-owned physical tools & reusable equipment
                </p>
              </div>
            </div>
          </div>

          {/* Top Header Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <a
              href="/equipment/qr-labels"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              Bulk QR Printing
            </a>

            <button
              onClick={() => setFormEquipment(null)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Register Equipment
            </button>
          </div>
        </div>

        {/* Database Statistics Overview (KPI Cards) */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <KpiCard
            label="Total Equipment"
            value={stats.total}
            icon={Boxes}
            tone="default"
          />
          <KpiCard
            label="Available"
            value={stats.available}
            subtext="Ready for technicians"
            icon={CheckCircle2}
            tone="success"
          />
          <KpiCard
            label="Checked Out"
            value={stats.checked_out}
            subtext="In active work"
            icon={Clock}
            tone="info"
          />
          <KpiCard
            label="Maintenance"
            value={stats.under_maintenance}
            subtext="Under repair"
            icon={Wrench}
            tone="warning"
          />
          <KpiCard
            label="Damaged"
            value={stats.damaged}
            subtext="Needs inspection"
            icon={AlertTriangle}
            tone="danger"
          />
          <KpiCard
            label="Missing / Lost"
            value={stats.missing}
            subtext="Unaccounted for"
            icon={HelpCircle}
            tone="purple"
          />
          <KpiCard
            label="Retired"
            value={stats.retired}
            subtext="Disposed / Scrapped"
            icon={Archive}
            tone="slate"
          />
        </div>

        {/* Filter & Search Bar */}
        <FilterBar
          filters={filters}
          onChange={(newFilters) => setFilters(newFilters)}
          onRegisterClick={() => setFormEquipment(null)}
          stats={stats}
        />

        {/* Master Equipment Table */}
        <EquipmentTable
          equipmentList={items}
          isLoading={isLoading}
          onView={(eq) => setSelectedEquipment(eq)}
          onEdit={(eq) => setFormEquipment(eq)}
          onDelete={(eq) => handleDelete(eq)}
          onPrintQr={(eq) => setQrModalEquipment(eq)}
          sortBy={filters.sort}
          sortDirection={filters.direction}
          onSort={(col, dir) => setFilters((f) => ({ ...f, sort: col, direction: dir }))}
        />

        {/* Table Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-xl">
            <p className="text-xs text-slate-600">
              Showing <span className="font-semibold">{meta.from || 1}</span> to{' '}
              <span className="font-semibold">{meta.to || items.length}</span> of{' '}
              <span className="font-semibold">{meta.total || items.length}</span> pieces of equipment (Page{' '}
              <strong>{meta.current_page}</strong> of <strong>{meta.last_page}</strong>)
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={meta.current_page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Modals & Drawers */}

        {/* 1. Register / Edit Equipment Modal */}
        {formEquipment !== undefined && (
          <EquipmentFormModal
            equipment={formEquipment}
            onClose={() => setFormEquipment(undefined)}
            onRegistered={() => {
              handleRefresh();
            }}
          />
        )}

        {/* 2. Equipment Details & History Drawer */}
        {selectedEquipment && (
          <EquipmentDetailDrawer
            equipmentId={selectedEquipment.id}
            onClose={() => setSelectedEquipment(null)}
            onEdit={(eq) => setFormEquipment(eq)}
          />
        )}

        {/* 3. QR Label Preview & Print Modal */}
        {qrModalEquipment && (
          <EquipmentQrPrintModal
            equipment={qrModalEquipment}
            onClose={() => setQrModalEquipment(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function KpiCard({ label, value, subtext, icon: Icon, tone = 'default' }) {
  const toneConfigs = {
    default: {
      text: 'text-slate-900',
      bg: 'bg-slate-50',
      iconColor: 'text-slate-600',
      border: 'border-slate-200',
    },
    success: {
      text: 'text-emerald-700',
      bg: 'bg-emerald-50/60',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-200/70',
    },
    info: {
      text: 'text-sky-700',
      bg: 'bg-sky-50/60',
      iconColor: 'text-sky-600',
      border: 'border-sky-200/70',
    },
    warning: {
      text: 'text-amber-700',
      bg: 'bg-amber-50/60',
      iconColor: 'text-amber-600',
      border: 'border-amber-200/70',
    },
    danger: {
      text: 'text-rose-700',
      bg: 'bg-rose-50/60',
      iconColor: 'text-rose-600',
      border: 'border-rose-200/70',
    },
    purple: {
      text: 'text-purple-700',
      bg: 'bg-purple-50/60',
      iconColor: 'text-purple-600',
      border: 'border-purple-200/70',
    },
    slate: {
      text: 'text-slate-700',
      bg: 'bg-slate-50/60',
      iconColor: 'text-slate-500',
      border: 'border-slate-200/70',
    },
  };

  const config = toneConfigs[tone] || toneConfigs.default;

  return (
    <div className={`rounded-xl border ${config.border} bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
          {label}
        </p>
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.bg} ${config.iconColor}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight ${config.text}`}>
        {value ?? 0}
      </p>
      {subtext && <p className="mt-0.5 text-[10px] text-slate-400 truncate">{subtext}</p>}
    </div>
  );
}

export default EquipmentPage;
