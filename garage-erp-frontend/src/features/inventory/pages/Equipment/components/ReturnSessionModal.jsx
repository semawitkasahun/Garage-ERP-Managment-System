import { useState } from 'react';
import { useCheckInEquipment, useLookupEquipmentByQr } from '@/hooks/useEquipment';
import { useToast } from '@/components/Toast';
import QrScannerModal from '@/components/QrScannerModal';

const CONDITIONS = ['Good', 'Damaged', 'Missing Parts', 'Needs Maintenance'];

export default function ReturnSessionModal({ onClose }) {
  const [scannedEquipment, setScannedEquipment] = useState(null);
  const [condition, setCondition] = useState('Good');
  const [notes, setNotes] = useState('');
  const [scanError, setScanError] = useState('');
  const [doneCount, setDoneCount] = useState(0);

  const lookup = useLookupEquipmentByQr();
  const checkIn = useCheckInEquipment();
  const toast = useToast();

  const handleDetected = (token) => {
    setScanError('');
    lookup.mutate(token, {
      onSuccess: ({ matched_type, equipment }) => {
        if (matched_type !== 'checkout') {
          setScanError(`That's ${equipment.name}'s tracking tag — scan the Checkout QR code instead.`);
          return;
        }
        if (!['Checked Out', 'Overdue'].includes(equipment.status)) {
          setScanError(`${equipment.name} isn't currently checked out.`);
          return;
        }
        setScannedEquipment(equipment);
        setCondition('Good');
        setNotes('');
      },
      onError: () => setScanError('No equipment matches this QR code.'),
    });
  };

  const confirmReturn = () => {
    if (['Damaged', 'Missing Parts'].includes(condition) && !notes.trim()) {
      setScanError('A note is required when returning equipment damaged or with missing parts.');
      return;
    }

    checkIn.mutate(
      { id: scannedEquipment.id, payload: { condition_on_return: condition, return_notes: notes || undefined } },
      {
        onSuccess: () => {
          toast.success(`${scannedEquipment.name} checked in — ${condition}.`);
          setDoneCount((c) => c + 1);
          setScannedEquipment(null);
        },
        onError: (err) => setScanError(err?.response?.data?.message ?? 'Could not check in this item.'),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Return Equipment</h2>
            {doneCount > 0 && <p className="text-xs text-emerald-600">{doneCount} item(s) returned this session</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">✕</button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {!scannedEquipment ? (
            <>
              <QrScannerModal
                title="Scan Checkout QR"
                hint="Point the camera at the equipment's Checkout QR tag."
                onDetected={handleDetected}
                onClose={onClose}
              />
              {scanError && <p className="text-sm text-rose-600">{scanError}</p>}
            </>
          ) : (
            <>
              <div className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">{scannedEquipment.name}</p>
                <p className="text-xs text-slate-400">{scannedEquipment.equipment_code}</p>
                <p className="mt-1 text-slate-600">Currently with: {scannedEquipment.assigned_employee?.name ?? '—'}</p>
              </div>

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

              {['Damaged', 'Missing Parts'].includes(condition) && (
                <label className="block text-sm font-medium text-slate-700">
                  Note (required)
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-400">Photo upload can be added from the equipment detail view after check-in.</span>
                </label>
              )}

              {scanError && <p className="text-sm text-rose-600">{scanError}</p>}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button onClick={() => setScannedEquipment(null)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Rescan
                </button>
                <button
                  disabled={checkIn.isPending}
                  onClick={confirmReturn}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {checkIn.isPending ? 'Confirming…' : 'Confirm Return'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
