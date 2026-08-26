<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\EquipmentRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EquipmentRequestController extends Controller
{
  public function index(Request $request)
  {
    $query = EquipmentRequest::query()->with(['equipment', 'requestedBy', 'reviewedBy']);

    if ($status = $request->string('status')->toString()) {
      $query->where('status', $status);
    }
    if ($employeeId = $request->integer('requested_by')) {
      $query->where('requested_by', $employeeId);
    }

    return $query->latest()->paginate($request->integer('per_page', 30));
  }

  public function store(Request $request)
  {
    $data = $request->validate([
      'equipment_id' => ['required', 'exists:equipment,id'],
      'work_order_id' => ['nullable', 'integer'],
      'job_card_id' => ['nullable', 'integer'],
      'reason' => ['nullable', 'string'],
    ]);

    $data['requested_by'] = $this->actorId($request);
    $data['status'] = 'Pending';

    $requestModel = EquipmentRequest::create($data)->load(['equipment', 'requestedBy']);
    return response()->json($requestModel, 201);
  }

  public function approve(Request $request, EquipmentRequest $equipmentRequest)
  {
    $this->assertPending($equipmentRequest);
    $data = $request->validate([
      'equipment_id' => ['sometimes', 'exists:equipment,id'],
      'review_notes' => ['nullable', 'string'],
    ]);

    $equipmentRequest->update([
      'equipment_id' => $data['equipment_id'] ?? $equipmentRequest->equipment_id,
      'status' => 'Approved',
      'reviewed_by' => $this->actorId($request),
      'reviewed_at' => now(),
      'review_notes' => $data['review_notes'] ?? null,
    ]);

    return $equipmentRequest->fresh(['equipment', 'requestedBy', 'reviewedBy']);
  }

  public function reject(Request $request, EquipmentRequest $equipmentRequest)
  {
    $this->assertPending($equipmentRequest);
    $data = $request->validate(['review_notes' => ['required', 'string']]);

    $equipmentRequest->update([
      'status' => 'Rejected',
      'reviewed_by' => $this->actorId($request),
      'reviewed_at' => now(),
      'review_notes' => $data['review_notes'],
    ]);

    return $equipmentRequest->fresh();
  }

  public function issue(Request $request, EquipmentRequest $equipmentRequest)
  {
    if ($equipmentRequest->status !== 'Approved') {
      return response()->json(['message' => 'Only an approved request can be issued.'], 422);
    }

    $data = $request->validate([
      'due_at' => ['required', 'date', 'after_or_equal:today'],
      'checkout_notes' => ['nullable', 'string'],
    ]);

    $equipment = Equipment::findOrFail($equipmentRequest->equipment_id);
    if ($equipment->status !== 'Available') {
      return response()->json([
        'message' => "Equipment is currently '{$equipment->status}' and cannot be checked out.",
      ], 422);
    }

    return DB::transaction(function () use ($request, $equipmentRequest, $equipment, $data) {
      $equipment->checkouts()->create([
        'employee_id' => $equipmentRequest->requested_by,
        'checked_out_by' => $this->actorId($request),
        'work_order_id' => $equipmentRequest->work_order_id,
        'job_card_id' => $equipmentRequest->job_card_id,
        'equipment_request_id' => $equipmentRequest->id,
        'checked_out_at' => now(),
        'due_at' => $data['due_at'],
        'checkout_notes' => $data['checkout_notes'] ?? $equipmentRequest->reason,
      ]);

      $equipment->update([
        'status' => 'Checked Out',
        'assigned_employee_id' => $equipmentRequest->requested_by,
      ]);

      $equipmentRequest->update(['status' => 'Issued']);

      return $equipmentRequest->fresh(['equipment', 'requestedBy', 'checkout']);
    });
  }

  private function assertPending(EquipmentRequest $request): void
  {
    if ($request->status !== 'Pending') {
      abort(422, 'This request has already been reviewed.');
    }
  }

  private function actorId(Request $request): ?int
  {
    return $request->user()?->employee_id ?? $request->user()?->id;
  }
}
