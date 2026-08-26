import React, { useState } from 'react';
import { equipmentApi } from '@/api/equipment';
import { useQrImage } from '@/hooks/useEquipment';
import { Printer, QrCode, X, Check, Copy, RotateCw, AlertTriangle } from 'lucide-react';

/** Renders a QR code fetched via authenticated axios client as a blob object URL */
function QrImageDisplay({ equipmentId, type, alt }) {
  const { objectUrl, isLoading, error } = useQrImage(equipmentId, type);

  if (isLoading) {
    return (
      <div className="flex h-36 w-36 items-center justify-center rounded-xl bg-slate-100">
        <RotateCw className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }
  if (error || !objectUrl) {
    return (
      <div className="flex h-36 w-36 flex-col items-center justify-center gap-1 rounded-xl bg-red-50 border border-red-200">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-[10px] text-red-500 text-center px-1">QR load failed</span>
      </div>
    );
  }
  return (
    <img
      src={objectUrl}
      alt={alt}
      className="h-36 w-36 object-contain"
    />
  );
}

/** Convert a Blob to a base64 data URL */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function printQrLabels(equipment, mode = 'both') {
  if (!equipment) return;

  // Fetch QR blobs via authenticated axios client, then convert to base64 data URLs
  const [checkoutDataUrl, trackingDataUrl] = await Promise.all([
    equipmentApi.fetchQrBlob(equipment.id, 'checkout').then(blobToDataUrl),
    equipmentApi.fetchQrBlob(equipment.id, 'tracking').then(blobToDataUrl),
  ]);

  const checkoutQrUrl = checkoutDataUrl;
  const trackingQrUrl = trackingDataUrl;


  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;

  const labelCheckoutHtml = `
    <div class="label-card">
      <div class="header">GARAGE ERP</div>
      <div class="equipment-name">${equipment.name || 'EQUIPMENT'}</div>
      <div class="equipment-code">${equipment.equipment_code}</div>
      <div class="qr-box">
        <img src="${checkoutQrUrl}" alt="Check-Out QR" class="qr-img" />
      </div>
      <div class="action-tag checkout-tag">CHECK-OUT</div>
      <div class="footer-note">Internal Garage Asset</div>
    </div>
  `;

  const labelCheckinHtml = `
    <div class="label-card">
      <div class="header">GARAGE ERP</div>
      <div class="equipment-name">${equipment.name || 'EQUIPMENT'}</div>
      <div class="equipment-code">${equipment.equipment_code}</div>
      <div class="qr-box">
        <img src="${trackingQrUrl}" alt="Check-In QR" class="qr-img" />
      </div>
      <div class="action-tag checkin-tag">CHECK-IN</div>
      <div class="footer-note">Internal Garage Asset</div>
    </div>
  `;

  let labelsContent = '';
  if (mode === 'checkout') {
    labelsContent = labelCheckoutHtml;
  } else if (mode === 'checkin') {
    labelsContent = labelCheckinHtml;
  } else {
    labelsContent = `
      <div class="labels-container">
        ${labelCheckoutHtml}
        ${labelCheckinHtml}
      </div>
    `;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Equipment QR Labels - ${equipment.equipment_code}</title>
        <style>
          @page {
            size: auto;
            margin: 8mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #0f172a;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .labels-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }
          .label-card {
            width: 250px;
            border: 2px solid #0f172a;
            border-radius: 8px;
            padding: 14px 12px;
            text-align: center;
            background: #ffffff;
            page-break-inside: avoid;
          }
          .header {
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.5px;
            color: #475569;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .equipment-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            line-height: 1.2;
            margin-bottom: 4px;
            max-height: 34px;
            overflow: hidden;
          }
          .equipment-code {
            font-family: monospace;
            font-size: 13px;
            font-weight: 700;
            color: #0284c7;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .qr-box {
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 6px 0;
          }
          .qr-img {
            width: 140px;
            height: 140px;
            object-fit: contain;
          }
          .action-tag {
            display: inline-block;
            margin-top: 8px;
            padding: 3px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1px;
            color: #ffffff;
          }
          .checkout-tag {
            background-color: #0284c7;
          }
          .checkin-tag {
            background-color: #059669;
          }
          .footer-note {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          @media print {
            body {
              padding: 0;
              min-height: auto;
            }
          }
        </style>
      </head>
      <body>
        ${labelsContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export default function EquipmentQrPrintModal({ equipment, onClose }) {
  const [copiedToken, setCopiedToken] = useState(null);

  if (!equipment) return null;

  const copyToClipboard = (token, type) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(type);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Equipment QR Identity Labels</h3>
              <p className="text-xs text-slate-500">
                Permanent physical tags for {equipment.name} ({equipment.equipment_code})
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

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <span className="font-semibold">Permanent Physical Identification:</span> Each piece of equipment gets
            two dedicated QR labels: <strong>Check-Out</strong> (for handing to technicians) and <strong>Check-In</strong> (for equipment return & inspection). Print and affix them directly to the tool.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Check-Out QR Card */}
            <div className="flex flex-col items-center rounded-xl border border-sky-200 bg-sky-50/30 p-4 text-center">
              <div className="mb-2">
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-bold text-sky-800 uppercase tracking-wide">
                  1. Check-Out QR Label
                </span>
                <p className="mt-1 font-semibold text-slate-900 text-sm">{equipment.name}</p>
                <p className="font-mono text-xs text-sky-700">{equipment.equipment_code}</p>
              </div>

              <div className="my-2 rounded-xl bg-white p-3 shadow-xs border border-sky-100">
                <QrImageDisplay
                  equipmentId={equipment.id}
                  type="checkout"
                  alt={`Check-Out QR for ${equipment.equipment_code}`}
                />
              </div>

              <div className="mt-2 w-full flex items-center justify-between rounded bg-white px-2.5 py-1 text-xs text-slate-500 border border-slate-200">
                <span className="font-mono text-[11px] truncate max-w-[130px]">
                  Token: {equipment.checkout_qr_code || 'Auto-generated'}
                </span>
                <button
                  onClick={() => copyToClipboard(equipment.checkout_qr_code, 'checkout')}
                  className="text-sky-600 hover:text-sky-800 flex items-center gap-1 font-medium"
                >
                  {copiedToken === 'checkout' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedToken === 'checkout' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button
                onClick={() => printQrLabels(equipment, 'checkout')}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700 transition-colors shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Check-Out QR Only
              </button>
            </div>

            {/* Check-In QR Card */}
            <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 text-center">
              <div className="mb-2">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wide">
                  2. Check-In QR Label
                </span>
                <p className="mt-1 font-semibold text-slate-900 text-sm">{equipment.name}</p>
                <p className="font-mono text-xs text-emerald-700">{equipment.equipment_code}</p>
              </div>

              <div className="my-2 rounded-xl bg-white p-3 shadow-xs border border-emerald-100">
                <QrImageDisplay
                  equipmentId={equipment.id}
                  type="tracking"
                  alt={`Check-In QR for ${equipment.equipment_code}`}
                />
              </div>

              <div className="mt-2 w-full flex items-center justify-between rounded bg-white px-2.5 py-1 text-xs text-slate-500 border border-slate-200">
                <span className="font-mono text-[11px] truncate max-w-[130px]">
                  Token: {equipment.qr_code || 'Auto-generated'}
                </span>
                <button
                  onClick={() => copyToClipboard(equipment.qr_code, 'tracking')}
                  className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 font-medium"
                >
                  {copiedToken === 'tracking' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedToken === 'tracking' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <button
                onClick={() => printQrLabels(equipment, 'checkin')}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Check-In QR Only
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => printQrLabels(equipment, 'both')}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Both QR Labels (Sticker Sheet)
          </button>
        </div>
      </div>
    </div>
  );
}
