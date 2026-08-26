import { useState } from 'react';
import { useCheckOutEquipment } from '@/hooks/useEquipment';
// Use the simpler technicians endpoint that doesn't have role restrictions
import { useTechniciansList } from '@/hooks/useEmployees';

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CheckOutModal({ equipment, onClose }) {
  const [employeeId, setEmployeeId] = useState('');
  const [dueAt, setDueAt] = useState(defaultDueDate());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const { data: techniciansData } = useTechniciansList();
  const technicians = techniciansData ?? [];
  const checkOut = useCheckOutEquipment();

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!employeeId) {
      setError('Choose who this equipment is going to.');
      return;
    }
    checkOut
      .mutateAsync({
        id: equipment.id,
        payload: { employee_id: Number(employeeId), due_at: dueAt, checkout_notes: notes || undefined },
      })
      .then(onClose)
      .catch((err) => setError(err?.response?.data?.message ?? 'Could not check out this item.'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Check Out</h2>
          <p className="text-sm text-slate-500">{equipment.equipment_code} · {equipment.name}</p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          {error && <p className="text-sm text-rose-600">{error}</p>}

          <label className="block text-sm font-medium text-slate-700">
            Assign to
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="">Select a technician…</option>
              {technicians.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>{emp.name || emp.username || emp.email}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Due back by
            <input
              type="date"
              required
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
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
            <button type="submit" disabled={checkOut.isPending} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50">
              {checkOut.isPending ? 'Checking out…' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
