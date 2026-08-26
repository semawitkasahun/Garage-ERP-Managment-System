import { useState } from 'react';
import { useCheckInEquipment } from '@/hooks/useEquipment';

const CONDITIONS = ['New', 'Good', 'Fair', 'Poor', 'Damaged'];

export default function CheckInModal({ equipment, onClose }) {
  const [condition, setCondition] = useState(equipment.condition ?? 'Good');
  const [sendToMaintenance, setSendToMaintenance] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const checkIn = useCheckInEquipment();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    checkIn
      .mutateAsync({
        id: equipment.id,
        payload: {
          condition_on_return: condition,
          return_notes: notes || undefined,
          send_to_maintenance: sendToMaintenance,
        },
      })
      .then(onClose)
      .catch((err) => setError(err?.response?.data?.message ?? 'Could not check in this item.'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Check In</h2>
          <p className="text-sm text-slate-500">{equipment.equipment_code} · {equipment.name}</p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {error && <p className="text-sm text-rose-600">{error}</p>}

          <label className="block text-sm font-medium text-slate-700">
            Condition on return
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={sendToMaintenance}
              onChange={(e) => setSendToMaintenance(e.target.checked)}
              className="rounded border-slate-300"
            />
            Send straight to Maintenance instead of Available
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Notes (optional)
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </label>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancel
            </button>
            <button type="submit" disabled={checkIn.isPending} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
              {checkIn.isPending ? 'Checking in…' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
