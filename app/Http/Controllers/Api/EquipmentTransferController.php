<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentTransferController extends Controller
{
  public function index(Request $request)
  {
    $query = EquipmentTransfer::query()->with(['equipment', 'fromEmployee', 'toEmployee', 'approvedBy']);

    if ($equipmentId = $request->integer('equipment_id')) {
      $query->where('equipment_id', $equipmentId);
    }

    return $query->latest('transferred_at')->paginate($request->integer('per_page', 30));
  }

  public function store(Request $request, Equipment $equipment)
  {
    $data = $request->validate([
      'to_employee_id' => ['required', 'exists:employees,employee_id'],
      'reason' => ['required', 'string'],
      'work_order_id' => ['nullable', 'integer'],
      'job_card_id' => ['nullable', 'integer'],
    ]);

    /** @var \App\Models\EquipmentCheckout|null $openCheckout */
    $openCheckout = $equipment->activeCheckout()->latest('checked_out_at')->first();
    if (!in_array($equipment->status, ['Checked Out', 'Overdue'], true) || !$openCheckout) {
      return response()->json(['message' => 'This equipment is not currently checked out to anyone.'], 422);
    }

    return DB::transaction(function () use ($request, $equipment, $data, $openCheckout) {
      $approvedBy = $request->user()?->employee_id ?? $request->user()?->id;

      $openCheckout->update([
        'returned_at' => now(),
        'returned_to' => $approvedBy,
        'return_notes' => 'Transferred to another technician: ' . $data['reason'],
        'closed_reason' => 'transferred',
      ]);

      $newCheckout = $equipment->checkouts()->create([
        'employee_id' => $data['to_employee_id'],
        'checked_out_by' => $approvedBy,
        'work_order_id' => $data['work_order_id'] ?? $openCheckout->work_order_id,
        'job_card_id' => $data['job_card_id'] ?? $openCheckout->job_card_id,
        'checked_out_at' => now(),
        'due_at' => $openCheckout->due_at,
        'checkout_notes' => 'Received via transfer: ' . $data['reason'],
      ]);

      $equipment->update([
        'assigned_employee_id' => $data['to_employee_id'],
        'status' => 'Checked Out',
      ]);

      return EquipmentTransfer::create([
        'equipment_id' => $equipment->id,
        'from_employee_id' => $openCheckout->employee_id,
        'to_employee_id' => $data['to_employee_id'],
        'work_order_id' => $data['work_order_id'] ?? $openCheckout->work_order_id,
        'job_card_id' => $data['job_card_id'] ?? $openCheckout->job_card_id,
        'reason' => $data['reason'],
        'approved_by' => $approvedBy,
        'previous_checkout_id' => $openCheckout->id,
        'new_checkout_id' => $newCheckout->id,
        'transferred_at' => now(),
      ])->load(['equipment', 'fromEmployee', 'toEmployee', 'approvedBy']);
    });
  }
}
