import React, { useState } from 'react';
import { useEquipmentDetail, useRegenerateQr, useEquipmentHistory, useQrImage } from '@/hooks/useEquipment';
import { StatusBadge, ConditionBadge } from './StatusBadge';
import { printQrLabels } from './EquipmentQrPrintModal';
import {
  X,
  QrCode,
  History,
  FileText,
  Printer,
  RotateCw,
  Edit,
  Tag,
  MapPin,
  Calendar,
  DollarSign,
  Info,
  Clock,
  User,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRightCircle,
  Copy,
  Check,
} from 'lucide-react';

/** Renders a QR code fetched via the authenticated axios client as a blob object URL. */
function QrImageDisplay({ equipmentId, type, alt }) {
  const { objectUrl, isLoading, error } = useQrImage(equipmentId, type);

  if (isLoading) {
    return (
      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-slate-100">
        <RotateCw className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !objectUrl) {
    return (
      <div className="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-xl bg-red-50 border border-red-200">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-[10px] text-red-500 text-center px-1">QR load failed</span>
      </div>
    );
  }
  return (
    <img
      src={objectUrl}
      alt={alt}
      className="h-32 w-32 object-contain"
    />
  );
}

export default function EquipmentDetailDrawer({ equipmentId, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'qr' | 'history'
  const [copiedToken, setCopiedToken] = useState(null);

  const { data: responseData, isLoading, refetch } = useEquipmentDetail(equipmentId);
  const { data: historyData, isLoading: historyLoading } = useEquipmentHistory(equipmentId);
  const regenerateQr = useRegenerateQr();

  const eq = responseData?.data || responseData;
  const histories = historyData?.data || eq?.histories || [];

  const copyToClipboard = (token, key) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(key);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRegenerate = async () => {
    if (window.confirm('Regenerate permanent QR tokens for this equipment? Old physical stickers will need to be replaced.')) {
      await regenerateQr.mutateAsync(eq.id);
      refetch();
    }
  };

  if (!equipmentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {eq?.equipment_code || 'Loading...'}
              </span>
              {eq && <StatusBadge status={eq.status} />}
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{eq?.name || 'Equipment Master Record'}</h2>
            <p className="text-xs text-slate-500">{eq?.category} · {eq?.brand || 'Garage Asset'}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-1.5 border-b-2 py-3 text-xs font-semibold transition-colors ${
              activeTab === 'info'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            Equipment Information
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'qr'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="h-4 w-4" />
            QR Identity & Labels
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 border-b-2 py-3 px-4 text-xs font-semibold transition-colors ${
              activeTab === 'history'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="h-4 w-4" />
            Timeline & History ({histories.length})
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading || !eq ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
              <RotateCw className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading equipment master data…</p>
            </div>
          ) : (
            <>
              {/* TAB 1: EQUIPMENT INFORMATION */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Quick Summary Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Equipment Code</p>
                        <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">{eq.equipment_code}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</p>
                        <div className="mt-1">
                          <StatusBadge status={eq.status} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Condition</p>
                        <div className="mt-1">
                          <ConditionBadge condition={eq.condition} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Storage Location</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {eq.storage_location || eq.current_location || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Registered Date</p>
                        <p className="mt-0.5 text-sm font-medium text-slate-900 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {eq.registered_date || eq.created_at?.slice(0, 10) || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">QR Status</p>
                        <p className="mt-0.5 text-sm font-semibold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          QR Ready
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Checkout info if checked out */}
                  {eq.status === 'Checked Out' && eq.assigned_employee && (
                    <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 text-sm text-sky-900">
                      <p className="font-semibold flex items-center gap-1.5">
                        <User className="h-4 w-4 text-sky-700" /> Currently Checked Out to Technician
                      </p>
                      <p className="mt-1 text-sky-800">
                        Assigned to: <strong>{eq.assigned_employee.name}</strong>
                      </p>
                      {eq.active_checkout && (
                        <p className="text-xs text-sky-700 mt-0.5">
                          Due Date: {eq.active_checkout.due_at?.slice(0, 10) || 'Not set'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Technical Master Data Grid */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                      Master Specifications
                    </h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 p-4 text-xs sm:grid-cols-2">
                      <DetailRow label="Category" value={eq.category} />
                      <DetailRow label="Brand / Manufacturer" value={eq.brand} />
                      <DetailRow label="Model / Spec" value={eq.model} />
                      <DetailRow label="Serial Number" value={eq.serial_number} isMono />
                      <DetailRow label="Storage Location" value={eq.storage_location || eq.current_location} />
                      <DetailRow label="Purchase Date" value={eq.purchase_date} />
                      <DetailRow
                        label="Purchase Cost"
                        value={eq.purchase_cost ? `ETB ${Number(eq.purchase_cost).toLocaleString()}` : null}
                      />
                      <DetailRow label="Last Maintenance Date" value={eq.last_maintenance_date} />
                      <DetailRow label="Next Maintenance Due" value={eq.next_maintenance_due} />
                    </dl>
                  </div>

                  {/* Description */}
                  {eq.description && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs leading-relaxed text-slate-700">
                        {eq.description}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {eq.notes && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Internal Notes</h3>
                      <div className="rounded-xl border border-slate-200 bg-amber-50/40 p-3.5 text-xs leading-relaxed text-slate-700">
                        {eq.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QR IDENTITY & LABELS */}
              {activeTab === 'qr' && (
                <div className="space-y-6">
                  <div className="rounded-lg bg-sky-50 border border-sky-200 p-3.5 text-xs text-sky-800">
                    <p className="font-semibold flex items-center gap-1.5 mb-1">
                      <QrCode className="h-4 w-4" /> Permanent Physical Equipment QR Identities
                    </p>
                    <p>
                      Each physical equipment has 2 unique QR codes: <strong>Check-Out QR</strong> (for handing equipment to a technician) and <strong>Check-In QR</strong> (for returns & tracking). Print and affix to physical equipment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Check-Out QR Card */}
                    <div className="flex flex-col items-center rounded-xl border border-sky-200 bg-sky-50/20 p-4 text-center">
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 uppercase tracking-wide">
                        Check-Out QR Label
                      </span>
                      <p className="mt-1 font-semibold text-slate-900 text-xs">{eq.name}</p>
                      <p className="font-mono text-xs text-sky-700">{eq.equipment_code}</p>

                      <div className="my-3 rounded-xl bg-white p-3 shadow-xs border border-sky-100">
                        <QrImageDisplay equipmentId={eq.id} type="checkout" alt="Check-Out QR" />
                      </div>

                      <div className="w-full flex items-center justify-between rounded bg-white px-2 py-1 text-[11px] text-slate-500 border border-slate-200 mb-3">
                        <span className="font-mono truncate max-w-[120px]">
                          {eq.checkout_qr_code || 'EQ-OUT'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(eq.checkout_qr_code, 'checkout')}
                          className="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                        >
                          {copiedToken === 'checkout' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          {copiedToken === 'checkout' ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <button
                        onClick={() => printQrLabels(eq, 'checkout')}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 transition-colors shadow-xs"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print Check-Out QR
                      </button>
                    </div>

                    {/* Check-In QR Card */}
                    <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50/20 p-4 text-center">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                        Check-In QR Label
                      </span>
                      <p className="mt-1 font-semibold text-slate-900 text-xs">{eq.name}</p>
                      <p className="font-mono text-xs text-emerald-700">{eq.equipment_code}</p>

                      <div className="my-3 rounded-xl bg-white p-3 shadow-xs border border-emerald-100">
                        <QrImageDisplay equipmentId={eq.id} type="tracking" alt="Check-In QR" />
                      </div>

                      <div className="w-full flex items-center justify-between rounded bg-white px-2 py-1 text-[11px] text-slate-500 border border-slate-200 mb-3">
                        <span className="font-mono truncate max-w-[120px]">
                          {eq.qr_code || 'EQ-IN'}
                        </span>
                        <button
                          onClick={() => copyToClipboard(eq.qr_code, 'tracking')}
                          className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-medium"
                        >
                          {copiedToken === 'tracking' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          {copiedToken === 'tracking' ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <button
                        onClick={() => printQrLabels(eq, 'checkin')}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print Check-In QR
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Print Both Labels (Sticker Sheet)</p>
                      <p className="text-[11px] text-slate-500">Prints side-by-side sticker tags ready to attach.</p>
                    </div>
                    <button
                      onClick={() => printQrLabels(eq, 'both')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs"
                    >
                      <Printer className="h-4 w-4" />
                      Print Both Labels
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-xs text-slate-500">
                    <span>Lost or damaged physical tag sticker?</span>
                    <button
                      onClick={handleRegenerate}
                      disabled={regenerateQr.isPending}
                      className="text-slate-600 hover:text-slate-900 font-medium underline decoration-dotted flex items-center gap-1"
                    >
                      <RotateCw className={`h-3 w-3 ${regenerateQr.isPending ? 'animate-spin' : ''}`} />
                      {regenerateQr.isPending ? 'Regenerating…' : 'Regenerate QR Tokens'}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: TIMELINE & HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Chronological History Log
                    </h3>
                    <span className="text-[11px] text-slate-400">{histories.length} record(s)</span>
                  </div>

                  {historyLoading ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading history…</div>
                  ) : histories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                      No event records logged yet for this equipment.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {histories.map((event, idx) => (
                        <div key={event.id || idx} className="relative group">
                          <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-2 ring-slate-300 group-hover:ring-sky-500 transition-all">
                            {getEventIcon(event.event_type)}
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-slate-300 transition-all">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900">{event.title}</h4>
                              <span className="text-[10px] font-medium text-slate-400 shrink-0">
                                {event.formatted_date || event.event_date?.slice(0, 16).replace('T', ' ') || '—'}
                              </span>
                            </div>
                            {event.description && (
                              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{event.description}</p>
                            )}
                            {event.performed_by && (
                              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                                <User className="h-3 w-3" />
                                <span>Logged by: {event.performed_by}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printQrLabels(eq, 'both')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              Print QR Labels
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(eq);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Equipment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, isMono }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-xs font-semibold text-slate-800 ${isMono ? 'font-mono' : ''}`}>
        {value || '—'}
      </dd>
    </div>
  );
}

function getEventIcon(eventType) {
  switch (eventType) {
    case 'registered':
      return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
    case 'qr_generated':
      return <QrCode className="h-3 w-3 text-sky-600" />;
    case 'checked_out':
      return <ArrowRightCircle className="h-3 w-3 text-sky-600" />;
    case 'checked_in':
      return <CheckCircle2 className="h-3 w-3 text-teal-600" />;
    case 'maintenance_started':
    case 'maintenance':
      return <Wrench className="h-3 w-3 text-amber-600" />;
    case 'maintenance_completed':
      return <CheckCircle2 className="h-3 w-3 text-emerald-600" />;
    case 'status_changed':
    case 'condition_changed':
    case 'updated':
      return <Info className="h-3 w-3 text-indigo-600" />;
    case 'missing':
    case 'retired':
      return <AlertTriangle className="h-3 w-3 text-rose-600" />;
    default:
      return <Clock className="h-3 w-3 text-slate-400" />;
  }
}
