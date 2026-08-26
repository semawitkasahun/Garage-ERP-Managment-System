import React from 'react';
import { StatusBadge, ConditionBadge } from './StatusBadge';
import { Eye, Printer, Edit, Trash2, QrCode, ShieldCheck, MapPin, Tag } from 'lucide-react';

export default function EquipmentTable({
  items,
  equipmentList,
  isLoading,
  onViewDetails,
  onView,
  onPrintQr,
  onEdit,
  onDelete,
}) {
  const data = items || equipmentList || [];
  const handleView = onViewDetails || onView;
  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mb-3" />
        <p className="text-sm font-medium text-slate-700">Loading Equipment Registry…</p>
        <p className="text-xs text-slate-400">Fetching master equipment records from database</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-3">
          <Tag className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No Equipment Records Found</h3>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          No equipment matches the selected search and filter criteria, or no equipment has been registered yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 pl-4 pr-3">Equipment Code</th>
              <th className="py-3.5 px-3">Equipment Name</th>
              <th className="py-3.5 px-3">Category</th>
              <th className="py-3.5 px-3">Brand</th>
              <th className="py-3.5 px-3">Model</th>
              <th className="py-3.5 px-3">Serial Number</th>
              <th className="py-3.5 px-3">Storage Location</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 px-3">Condition</th>
              <th className="py-3.5 px-3">QR Status</th>
              <th className="py-3.5 px-3">Registered Date</th>
              <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
            {data.map((eq) => (
              <tr
                key={eq.id}
                onClick={() => handleView?.(eq)}
                className="group cursor-pointer transition-colors hover:bg-sky-50/40"
              >
                {/* Equipment Code */}
                <td className="py-3.5 pl-4 pr-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/80 group-hover:border-sky-300">
                    <Tag className="h-3 w-3 text-sky-600" />
                    {eq.equipment_code}
                  </span>
                </td>

                {/* Equipment Name */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <div className="font-semibold text-slate-900 group-hover:text-sky-950 transition-colors">
                    {eq.name}
                  </div>
                  {eq.assigned_employee && eq.status === 'Checked Out' && (
                    <div className="text-[10px] text-sky-600 font-medium">
                      With: {eq.assigned_employee.name}
                    </div>
                  )}
                </td>

                {/* Category */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {eq.category}
                  </span>
                </td>

                {/* Brand */}
                <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                  {eq.brand || '—'}
                </td>

                {/* Model */}
                <td className="py-3.5 px-3 whitespace-nowrap text-slate-600">
                  {eq.model || '—'}
                </td>

                {/* Serial Number */}
                <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500">
                  {eq.serial_number || '—'}
                </td>

                {/* Storage Location */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    {eq.storage_location || eq.current_location || '—'}
                  </span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <StatusBadge status={eq.status} />
                </td>

                {/* Condition */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <ConditionBadge condition={eq.condition} />
                </td>

                {/* QR Status */}
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    QR Ready
                  </span>
                </td>

                {/* Registered Date */}
                <td className="py-3.5 px-3 whitespace-nowrap text-slate-500">
                  {eq.registered_date || (eq.created_at ? new Date(eq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')}
                </td>

                {/* Actions */}
                <td
                  className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      title="View Equipment Details & History"
                      onClick={() => handleView?.(eq)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Print QR Labels"
                      onClick={() => onPrintQr(eq)}
                      className="rounded-md p-1.5 text-sky-600 hover:bg-sky-50 hover:text-sky-800 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Edit Master Record"
                      onClick={() => onEdit(eq)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Delete / Retire Equipment"
                      onClick={() => onDelete(eq)}
                      className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
