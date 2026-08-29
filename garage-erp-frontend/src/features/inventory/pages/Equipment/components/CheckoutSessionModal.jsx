import { useState } from 'react';
import { useCheckOutEquipment, useLookupEquipmentByQr } from '@/hooks/useEquipment';
import { useToast } from '@/components/Toast';
import QrScannerModal from '@/components/QrScannerModal';
// Use the simpler technicians endpoint that doesn't have role restrictions
import { useTechniciansList } from '@/hooks/useEmployees';

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function CheckoutSessionModal({ onClose }) {
  const [step, setStep] = useState('setup'); // setup | scanning | review
  const [employeeId, setEmployeeId] = useState('');
  const [workOrderId, setWorkOrderId] = useState('');
  const [jobCardId, setJobCardId] = useState('');
  const [dueAt, setDueAt] = useState(tomorrow());
  const [scanned, setScanned] = useState([]); // [{equipment}]
  const [scanError, setScanError] = useState('');

  // Fetch all technicians (simpler endpoint without role restrictions)
  const { data: techniciansData, isLoading: empLoading } = useTechniciansList();
  const technicians = techniciansData ?? [];

  const lookup = useLookupEquipmentByQr();
  const checkOut = useCheckOutEquipment();
  const toast = useToast();

  // The technicians endpoint now returns employee data from the Employee table
  const empName = (e) => e.name || e.username || e.email || `Technician #${e.employee_id}`;
  const technician = technicians.find((e) => String(e.employee_id) === String(employeeId));

  const handleDetected = (token) => {
    setScanError('');
    lookup.mutate(token, {
      onSuccess: ({ matched_type, equipment }) => {
        if (matched_type !== 'checkout') {
          setScanError(`That's ${equipment.name}'s tracking tag — scan the Checkout QR code instead.`);
          return;
        }
        if (equipment.status !== 'Available') {
          setScanError(`${equipment.name} (${equipment.equipment_code}) is currently ${equipment.status} — cannot check out.`);
          return;
        }
        if (scanned.some((s) => s.equipment.id === equipment.id)) {
          setScanError(`${equipment.name} is already in this checkout list.`);
          return;
        }
        setScanned((list) => [...list, { equipment }]);
      },
      onError: () => setScanError('No equipment matches this QR code.'),
    });
  };

  const removeItem = (id) => setScanned((list) => list.filter((s) => s.equipment.id !== id));

  const confirmCheckout = async () => {
    try {
      for (const { equipment } of scanned) {
        await checkOut.mutateAsync({
          id: equipment.id,
          payload: {
            employee_id: Number(employeeId),
            work_order_id: workOrderId || undefined,
            job_card_id: jobCardId || undefined,
            due_at: dueAt,
          },
        });
      }
      toast.success(`Checked out ${scanned.length} item(s) to ${technician?.name}.`);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Checkout failed partway through — review equipment statuses.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Check Out Equipment</h2>
            <p className="text-xs text-slate-400">
              {step === 'setup' && 'Step 1 of 3 — Who is this for?'}
              {step === 'scanning' && 'Step 2 of 3 — Scan each item\'s Checkout QR'}
              {step === 'review' && 'Step 3 of 3 — Review & confirm'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>

        {step === 'setup' && (
          <div className="space-y-4 px-6 py-5">
            <label className="block text-sm font-medium text-slate-700">
              Technician *
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={empLoading}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {empLoading ? 'Loading technicians…' : technicians.length === 0 ? 'No technicians found' : '— Select a technician —'}
                </option>
                {technicians.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {empName(emp)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Work Order (optional)
                <input
                  value={workOrderId}
                  onChange={(e) => setWorkOrderId(e.target.value)}
                  placeholder="WO ID"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Job Card (optional)
                <input
                  value={jobCardId}
                  onChange={(e) => setJobCardId(e.target.value)}
                  placeholder="JC ID"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Expected return
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </label>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Cancel
              </button>
              <button
                disabled={!employeeId}
                onClick={() => setStep('scanning')}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Start Scanning
              </button>
            </div>
          </div>
        )}

        {step === 'scanning' && (
          <div className="space-y-4 px-6 py-5">
            <p className="text-sm text-slate-500">Checking out to <span className="font-medium text-slate-900">{technician ? empName(technician) : '—'}</span></p>

            <QrScannerModal
              open={step === 'scanning'}
              title="Scan Checkout QR"
              hint="Point the camera at the equipment's Checkout QR tag."
              onDetected={handleDetected}
              onClose={() => setStep('review')}
            />

            {scanError && <p className="text-sm text-rose-600">{scanError}</p>}

            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Scanned ({scanned.length})</p>
              <ul className="space-y-1">
                {scanned.map(({ equipment }) => (
                  <li key={equipment.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span>{equipment.name} <span className="font-mono text-xs text-slate-400">{equipment.equipment_code}</span></span>
                    <button onClick={() => removeItem(equipment.id)} className="text-xs text-rose-600 hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => setStep('setup')} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Back
              </button>
              <button
                disabled={scanned.length === 0}
                onClick={() => setStep('review')}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
              >
                Done Scanning ({scanned.length})
              </button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-lg bg-sky-50 p-3 text-sm text-sky-900">
              Checking out <strong>{scanned.length}</strong> item(s) to <strong>{technician ? empName(technician) : '—'}</strong>, due back {dueAt}.
            </div>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {scanned.map(({ equipment }) => (
                <li key={equipment.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{equipment.name}</span>
                  <span className="font-mono text-xs text-slate-400">{equipment.equipment_code}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button onClick={() => setStep('scanning')} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                Scan more
              </button>
              <button
                disabled={checkOut.isPending}
                onClick={confirmCheckout}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {checkOut.isPending ? 'Confirming…' : 'Confirm Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
