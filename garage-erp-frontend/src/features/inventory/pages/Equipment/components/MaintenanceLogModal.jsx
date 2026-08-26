import { useState } from 'react';
import { useAddMaintenanceLog } from '@/hooks/useEquipment';

const TYPES = ['Routine', 'Repair', 'Inspection', 'Calibration', 'Other'];

const today = () => new Date().toISOString().slice(0, 10);

export default function MaintenanceLogModal({ equipment, onClose }) {
  const [form, setForm] = useState({
    type: 'Routine',
    description: '',
    cost: '',
    performed_by: '',
    performed_at: today(),
    next_due_at: '',
    in_progress: false,
  });
  const [error, setError] = useState('');

  const addLog = useAddMaintenanceLog();
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    addLog
      .mutateAsync({
        id: equipment.id,
        payload: {
          ...form,
          cost: form.cost === '' ? null : Number(form.cost),
          next_due_at: form.next_due_at || null,
        },
      })
      .then(onClose)
      .catch((err) => setError(err?.response?.data?.message ?? 'Could not save this maintenance log.'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Log Maintenance</h2>
          <p className="text-sm text-slate-500">{equipment.equipment_code} · {equipment.name}</p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Type
              <select value={form.type} onChange={(e) => set({ type: e.target.value })} className={inputCls}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Date performed
              <input type="date" required value={form.performed_at} onChange={(e) => set({ performed_at: e.target.value })} className={inputCls} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Cost
              <input type="number" step="0.01" min="0" value={form.cost} onChange={(e) => set({ cost: e.target.value })} className={inputCls} />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Performed by
              <input value={form.performed_by} onChange={(e) => set({ performed_by: e.target.value })} className={inputCls} placeholder="Tech or vendor name" />
            </label>
            <label className="col-span-2 block text-sm font-medium text-slate-700">
              Next due (optional)
              <input type="date" value={form.next_due_at} onChange={(e) => set({ next_due_at: e.target.value })} className={inputCls} />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea required value={form.description} onChange={(e) => set({ description: e.target.value })} rows={3} className={inputCls} />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.in_progress}
              onChange={(e) => set({ in_progress: e.target.checked })}
              className="rounded border-slate-300"
            />
            This work is still in progress — set status to Maintenance
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={addLog.isPending} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
              {addLog.isPending ? 'Saving…' : 'Save log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900/10';
