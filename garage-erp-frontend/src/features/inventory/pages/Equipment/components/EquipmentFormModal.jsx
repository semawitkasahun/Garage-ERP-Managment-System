import React, { useEffect, useState } from 'react';
import { useCreateEquipment, useUpdateEquipment } from '@/hooks/useEquipment';
import { printQrLabels } from './EquipmentQrPrintModal';
import { Printer, QrCode, X, CheckCircle, AlertCircle, Wrench } from 'lucide-react';

const CATEGORIES = [
  'Hand Tools',
  'Power Tools',
  'Diagnostic Equipment',
  'Electrical Equipment',
  'Lifting Equipment',
  'Workshop Equipment',
  'Safety Equipment',
  'Cleaning Equipment',
  'Other',
];

const STATUSES = [
  'Available',
  'Checked Out',
  'Under Maintenance',
  'Damaged',
  'Missing',
  'Retired',
];

const CONDITIONS = [
  'N/A',
  'Excellent',
  'Good',
  'Fair',
  'Damaged',
];

const emptyForm = {
  name: '',
  category: 'Hand Tools',
  brand: '',
  model: '',
  serial_number: '',
  storage_location: '',
  current_location: '',
  status: 'Available',
  condition: 'N/A',
  purchase_date: '',
  purchase_cost: '',
  description: '',
  notes: '',
};

export default function EquipmentFormModal({ equipment, onClose, onRegistered }) {
  const isEdit = !!equipment;
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [createdItem, setCreatedItem] = useState(null);

  const createMutation = useCreateEquipment();
  const updateMutation = useUpdateEquipment();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || '',
        category: equipment.category || 'Hand Tools',
        brand: equipment.brand || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        storage_location: equipment.storage_location || equipment.current_location || '',
        current_location: equipment.storage_location || equipment.current_location || '',
        status: equipment.status || 'Available',
        condition: equipment.condition || 'N/A',
        purchase_date: equipment.purchase_date || '',
        purchase_cost: equipment.purchase_cost ?? '',
        description: equipment.description || '',
        notes: equipment.notes || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [equipment]);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Equipment name is required.';
    if (!form.category.trim()) newErrors.category = 'Category is required.';
    const locationVal = form.storage_location.trim() || form.current_location.trim();
    if (!locationVal) newErrors.storage_location = 'Storage location is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim() || null,
      model: form.model.trim() || null,
      serial_number: form.serial_number.trim() || null,
      current_location: locationVal,
      storage_location: locationVal,
      status: form.status,
      condition: form.condition === 'N/A' ? null : form.condition,
      purchase_date: form.purchase_date || null,
      purchase_cost: form.purchase_cost === '' ? null : Number(form.purchase_cost),
      description: form.description.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: equipment.id, payload });
        if (onRegistered) onRegistered();
        onClose();
      } else {
        const response = await createMutation.mutateAsync(payload);
        const savedData = response?.data || response;
        setCreatedItem(savedData);
        if (onRegistered) onRegistered(savedData);
      }
    } catch (err) {
      const respErrors = err?.response?.data?.errors;
      if (respErrors) {
        setErrors(respErrors);
      } else {
        setErrors({
          _general: err?.response?.data?.message || 'Failed to save equipment. Please verify the fields.',
        });
      }
    }
  };

  // If newly registered, show the Success & QR Generation step
  if (createdItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-emerald-600 px-6 py-6 text-white text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/50 text-white mb-3">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">Equipment Registered Successfully!</h2>
            <p className="text-emerald-100 text-xs mt-1">
              Permanent master record and QR identities created.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-500 text-xs font-medium uppercase">Equipment Code</span>
                <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {createdItem.equipment_code}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Name:</span>
                <span className="font-semibold text-slate-900">{createdItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Category:</span>
                <span className="text-slate-700">{createdItem.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Storage Location:</span>
                <span className="text-slate-700">{createdItem.storage_location || createdItem.current_location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-xs">Status:</span>
                <span className="font-medium text-emerald-700">{createdItem.status || 'Available'}</span>
              </div>
            </div>

            <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 text-xs text-sky-800">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <QrCode className="h-4 w-4" /> Next Step: Attach QR Labels
              </p>
              <p>
                Permanent Check-Out and Check-In QR identities have been generated. Print the labels now and attach them to the physical tool.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => printQrLabels(createdItem, 'both')}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Printer className="h-4 w-4" />
                Print Physical QR Labels Now
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Done & Return to Registry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? `Edit Equipment (${equipment.equipment_code})` : 'Register Equipment'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? 'Update equipment master record and location.'
                  : 'Add a reusable tool or equipment item to the permanent garage master registry.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errors._general && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errors._general}</span>
            </div>
          )}

          {!isEdit && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-800">Auto-Generated Master Identifiers:</p>
              <p className="mt-0.5">
                The system will automatically allocate the next unique <strong>Equipment Code (e.g. EQ-00001)</strong> and generate two permanent QR identities (Check-Out & Check-In).
              </p>
            </div>
          )}

          {/* Section 1: Required Basic Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1. Required Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Equipment Name" required error={errors.name}>
                <input
                  type="text"
                  placeholder="e.g. 1/2-Inch Impact Wrench"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="Equipment Category" required error={errors.category}>
                <select
                  value={form.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className={inputCls}
                  required
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Storage Location" required error={errors.storage_location}>
                <input
                  type="text"
                  placeholder="e.g. Tool Room A, Cabinet 2, Shelf 3"
                  value={form.storage_location}
                  onChange={(e) => {
                    setField('storage_location', e.target.value);
                    setField('current_location', e.target.value);
                  }}
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="Current Status" required error={errors.status}>
                <select
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className={inputCls}
                  required
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Section 2: Optional Specifications */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              2. Technical & Identification Details (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Brand / Manufacturer" error={errors.brand}>
                <input
                  type="text"
                  placeholder="e.g. Stanley, DeWalt, Bosch"
                  value={form.brand}
                  onChange={(e) => setField('brand', e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Model / Spec" error={errors.model}>
                <input
                  type="text"
                  placeholder="e.g. TW-50, DCD996"
                  value={form.model}
                  onChange={(e) => setField('model', e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Serial Number" error={errors.serial_number}>
                <input
                  type="text"
                  placeholder="e.g. SN-8849201"
                  value={form.serial_number}
                  onChange={(e) => setField('serial_number', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Section 3: Condition & Purchase Details (Optional) */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              3. Condition & Purchase Record (Optional)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Condition (Optional)"
                error={errors.condition}
                hint="Only select if condition tracking applies to this equipment type"
              >
                <select
                  value={form.condition}
                  onChange={(e) => setField('condition', e.target.value)}
                  className={inputCls}
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Purchase Date" error={errors.purchase_date}>
                <input
                  type="date"
                  value={form.purchase_date}
                  onChange={(e) => setField('purchase_date', e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field label="Purchase Cost (ETB / $)" error={errors.purchase_cost}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.purchase_cost}
                  onChange={(e) => setField('purchase_cost', e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Section 4: Description & Notes */}
          <div className="border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Description" error={errors.description}>
                <textarea
                  placeholder="Technical description, features, accessories included..."
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={2}
                  className={inputCls}
                />
              </Field>

              <Field label="Internal Notes" error={errors.notes}>
                <textarea
                  placeholder="Storage instructions, special handling, safety notes..."
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={2}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-sm"
            >
              {saving ? 'Saving to Database…' : isEdit ? 'Update Equipment' : 'Register Equipment & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all';

function Field({ label, required, error, hint, children }) {
  return (
    <label className="block text-xs font-semibold text-slate-700">
      {label}
      {required && <span className="text-rose-500 font-bold"> *</span>}
      {hint && <span className="block font-normal text-[11px] text-slate-400 mt-0.5">{hint}</span>}
      {children}
      {error && <p className="mt-1 text-xs font-normal text-rose-600">{Array.isArray(error) ? error[0] : error}</p>}
    </label>
  );
}
