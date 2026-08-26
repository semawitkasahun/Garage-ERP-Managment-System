<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentMaintenanceLog;
use App\Models\EquipmentMissingReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentMissingReportController extends Controller
{
  public function index(Request $request)
  {
    $query = EquipmentMissingReport::query()->with(['equipment', 'lastEmployee', 'reportedBy']);

    if ($status = $request->string('status')->toString()) {
      $query->where('status', $status);
    }

    return $query->latest('reported_at')->paginate($request->integer('per_page', 30));
  }

  public function store(Request $request, Equipment $equipment)
  {
    $data = $request->validate([
      'notes' => ['required', 'string'],
      'photos' => ['nullable', 'array'],
      'photos.*' => ['string'],
    ]);

    $lastCheckout = $equipment->checkouts()->latest('checked_out_at')->first();

    return DB::transaction(function () use ($request, $equipment, $data, $lastCheckout) {
      $report = EquipmentMissingReport::create([
        'equipment_id' => $equipment->id,
        'last_employee_id' => $lastCheckout?->employee_id ?? $equipment->assigned_employee_id,
        'last_work_order_id' => $lastCheckout?->work_order_id,
        'last_job_card_id' => $lastCheckout?->job_card_id,
        'last_known_location' => $equipment->current_location,
        'checkout_date' => $lastCheckout?->checked_out_at,
        'last_scanned_at' => now(),
        'reported_by' => $request->user()?->employee_id ?? $request->user()?->id,
        'reported_at' => now(),
        'notes' => $data['notes'],
        'photos' => $data['photos'] ?? null,
        'status' => 'Open',
      ]);

      $equipment->update(['status' => 'Missing']);

      return $report->load(['equipment', 'lastEmployee', 'reportedBy']);
    });
  }

  public function resolve(Request $request, EquipmentMissingReport $equipmentMissingReport)
  {
    if ($equipmentMissingReport->status !== 'Open') {
      return response()->json(['message' => 'This report has already been resolved.'], 422);
    }

    $data = $request->validate([
      'found_condition' => ['required', 'in:Good,Damaged'],
      'resolved_notes' => ['nullable', 'string'],
    ]);

    $equipment = $equipmentMissingReport->equipment;
    $resolvedBy = $request->user()?->employee_id ?? $request->user()?->id;

    DB::transaction(function () use ($equipmentMissingReport, $equipment, $data, $resolvedBy) {
      $foundDamaged = $data['found_condition'] === 'Damaged';

      $equipmentMissingReport->update([
        'status' => $foundDamaged ? 'Found Damaged' : 'Found',
        'resolved_at' => now(),
        'resolved_notes' => $data['resolved_notes'] ?? null,
        'resolved_by' => $resolvedBy,
      ]);

      $equipment->update(['status' => $foundDamaged ? 'Maintenance' : 'Available']);

      if ($foundDamaged) {
        EquipmentMaintenanceLog::create([
          'equipment_id' => $equipment->id,
          'logged_by' => $resolvedBy,
          'type' => 'Repair',
          'description' => 'Recovered after being reported missing - found damaged. ' . ($data['resolved_notes'] ?? ''),
          'performed_at' => now()->toDateString(),
        ]);
      }
    });

    return $equipmentMissingReport->fresh(['equipment', 'lastEmployee', 'reportedBy', 'resolvedBy']);
  }
}
