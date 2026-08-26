<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckInEquipmentRequest;
use App\Http\Requests\CheckOutEquipmentRequest;
use App\Http\Requests\StoreEquipmentRequest;
use App\Http\Requests\StoreMaintenanceLogRequest;
use App\Http\Requests\UpdateEquipmentRequest;
use App\Http\Resources\EquipmentHistoryResource;
use App\Http\Resources\EquipmentResource;
use App\Http\Resources\MaintenanceLogResource;
use App\Models\Equipment;
use App\Models\EquipmentCheckout;
use App\Models\EquipmentMaintenanceLog;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\SvgWriter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class EquipmentController extends Controller
{
    public function stats()
    {
        $all = Equipment::query()->get();

        $total = $all->count();
        $available = $all->where('status', 'Available')->count();
        $checkedOut = $all->where('status', 'Checked Out')->count();
        $underMaintenance = $all->whereIn('status', ['Under Maintenance', 'Maintenance'])->count();
        $damaged = $all->where('status', 'Damaged')->count();
        $missing = $all->where('status', 'Missing')->count();
        $retired = $all->where('status', 'Retired')->count();
        $unavailable = $total - $available;

        return response()->json([
            'total' => $total,
            'available' => $available,
            'checked_out' => $checkedOut,
            'under_maintenance' => $underMaintenance,
            'damaged' => $damaged,
            'missing' => $missing,
            'retired' => $retired,
            'available_summary' => $available,
            'unavailable_summary' => $unavailable,
            'categories' => Equipment::CATEGORIES,
            'statuses' => Equipment::STATUSES,
            'conditions' => Equipment::CONDITIONS,
        ]);
    }

    public function index(Request $request)
    {
        $query = Equipment::query()->with(['assignedEmployee']);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('equipment_code', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('current_location', 'like', "%{$search}%");
            });
        }

        if ($category = $request->string('category')->toString()) {
            $query->where('category', $category);
        }

        if ($status = $request->string('status')->toString()) {
            if ($status === 'Under Maintenance' || $status === 'Maintenance') {
                $query->whereIn('status', ['Under Maintenance', 'Maintenance']);
            } else {
                $query->where('status', $status);
            }
        }

        if ($availability = $request->string('availability')->toString()) {
            if ($availability === 'available') {
                $query->where('status', 'Available');
            } elseif ($availability === 'unavailable') {
                $query->where('status', '!=', 'Available');
            }
        }

        if ($condition = $request->string('condition')->toString()) {
            if ($condition === 'N/A' || $condition === 'none') {
                $query->where(function ($q) {
                    $q->whereNull('condition')->orWhere('condition', 'N/A')->orWhere('condition', '');
                });
            } else {
                $query->where('condition', $condition);
            }
        }

        if ($employeeId = $request->integer('assigned_employee_id')) {
            $query->where('assigned_employee_id', $employeeId);
        }

        $sort = $request->string('sort', 'created_at')->toString();
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['name', 'equipment_code', 'category', 'status', 'condition', 'created_at', 'purchase_date', 'current_location'];
        if (in_array($sort, $allowedSorts, true)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderByDesc('id');
        }

        $perPage = $request->integer('per_page', 20);
        return EquipmentResource::collection($query->paginate($perPage));
    }

    public function store(StoreEquipmentRequest $request)
    {
        $equipment = DB::transaction(function () use ($request) {
            $data = $request->validated();
            unset($data['storage_location']);
            return Equipment::create($data);
        });

        return EquipmentResource::make($equipment->fresh(['assignedEmployee', 'histories']))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Equipment $equipment)
    {
        $equipment->load([
            'assignedEmployee',
            'histories',
            'checkouts.employee',
            'checkouts.checkedOutBy',
            'maintenanceLogs.loggedBy'
        ]);

        return EquipmentResource::make($equipment);
    }

    public function update(UpdateEquipmentRequest $request, Equipment $equipment)
    {
        DB::transaction(function () use ($request, $equipment) {
            $oldStatus = $equipment->status;
            $oldCondition = $equipment->condition;
            $oldLocation = $equipment->current_location;

            $data = $request->validated();
            unset($data['storage_location']);

            $equipment->update($data);

            $userName = auth()->user()?->name ?? 'Supervisor';

            if (isset($data['status']) && $data['status'] !== $oldStatus) {
                $equipment->logEvent(
                    'status_changed',
                    "Status Changed to {$data['status']}",
                    "Equipment status updated from '{$oldStatus}' to '{$data['status']}'.",
                    $userName,
                    ['old_status' => $oldStatus, 'new_status' => $data['status']]
                );
            }

            if (array_key_exists('condition', $data) && $data['condition'] !== $oldCondition) {
                $newCondDisplay = $data['condition'] ?? 'N/A';
                $oldCondDisplay = $oldCondition ?? 'N/A';
                $equipment->logEvent(
                    'condition_changed',
                    "Condition Updated to {$newCondDisplay}",
                    "Condition modified from '{$oldCondDisplay}' to '{$newCondDisplay}'.",
                    $userName,
                    ['old_condition' => $oldCondition, 'new_condition' => $data['condition']]
                );
            }

            if (isset($data['current_location']) && $data['current_location'] !== $oldLocation) {
                $equipment->logEvent(
                    'updated',
                    "Storage Location Updated",
                    "Moved to: {$data['current_location']}",
                    $userName,
                    ['old_location' => $oldLocation, 'new_location' => $data['current_location']]
                );
            }
        });

        return EquipmentResource::make($equipment->fresh(['assignedEmployee', 'histories']));
    }

    public function destroy(Equipment $equipment)
    {
        $equipment->logEvent(
            'retired',
            'Equipment Removed/Retired',
            "Equipment {$equipment->equipment_code} record deleted from registry.",
            auth()->user()?->name ?? 'Supervisor'
        );

        $equipment->delete();
        return response()->json(['message' => 'Equipment deleted successfully.'], Response::HTTP_OK);
    }

    public function history(Equipment $equipment)
    {
        return EquipmentHistoryResource::collection($equipment->histories()->get());
    }

    public function checkOut(CheckOutEquipmentRequest $request, Equipment $equipment)
    {
        if ($equipment->status !== 'Available') {
            return response()->json(['message' => "Equipment is currently '{$equipment->status}' and cannot be checked out."], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($request, $equipment) {
            $employeeId = $request->validated('employee_id');
            $processedBy = $request->user()?->employee_id ?? $request->user()?->id;

            $checkout = $equipment->checkouts()->create([
                'employee_id' => $employeeId,
                'checked_out_by' => $processedBy,
                'work_order_id' => $request->validated('work_order_id'),
                'job_card_id' => $request->validated('job_card_id'),
                'checked_out_at' => now(),
                'due_at' => $request->validated('due_at'),
                'checkout_notes' => $request->validated('checkout_notes'),
            ]);

            $equipment->update(['status' => 'Checked Out', 'assigned_employee_id' => $employeeId]);

            $employeeName = $equipment->assignedEmployee?->name ?? 'Technician #' . $employeeId;
            $supervisorName = $request->user()?->name ?? 'Supervisor';

            $equipment->logEvent(
                'checked_out',
                "Checked Out",
                "Checked out to technician {$employeeName}. Due date: " . ($request->validated('due_at') ?? 'Not specified'),
                $supervisorName,
                ['checkout_id' => $checkout->id, 'employee_id' => $employeeId]
            );
        });

        return EquipmentResource::make($equipment->fresh(['assignedEmployee', 'checkouts.employee', 'histories']));
    }

    public function checkIn(CheckInEquipmentRequest $request, Equipment $equipment)
    {
        /** @var EquipmentCheckout|null $openCheckout */
        $openCheckout = $equipment->activeCheckout()->latest('checked_out_at')->first();
        if (!in_array($equipment->status, ['Checked Out', 'Overdue'], true) || !$openCheckout) {
            return response()->json(['message' => 'This equipment is not currently checked out.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $returnCondition = $request->validated('condition_on_return');
        $newStatus = $returnCondition === 'Good' ? 'Available' : 'Under Maintenance';
        $newGeneralCondition = match ($returnCondition) {
            'Good' => 'Good',
            'Damaged' => 'Damaged',
            default => 'Fair',
        };

        DB::transaction(function () use ($request, $equipment, $openCheckout, $returnCondition, $newStatus, $newGeneralCondition) {
            $openCheckout->update([
                'returned_at' => now(),
                'returned_to' => $request->user()?->employee_id ?? $request->user()?->id,
                'condition_on_return' => $returnCondition,
                'return_notes' => $request->validated('return_notes'),
                'return_photos' => $request->validated('photos'),
                'closed_reason' => 'returned',
            ]);

            $equipment->update([
                'status' => $newStatus,
                'condition' => $newGeneralCondition,
                'assigned_employee_id' => null,
            ]);

            $supervisorName = $request->user()?->name ?? 'Supervisor';

            $equipment->logEvent(
                'checked_in',
                "Checked In",
                "Returned in '{$returnCondition}' condition. " . ($request->validated('return_notes') ?? ''),
                $supervisorName,
                ['return_condition' => $returnCondition]
            );

            if ($newStatus === 'Under Maintenance') {
                $equipment->maintenanceLogs()->create([
                    'logged_by' => $request->user()?->employee_id ?? $request->user()?->id,
                    'type' => $returnCondition === 'Damaged' ? 'Repair' : 'Inspection',
                    'description' => "Returned as '{$returnCondition}'. " . ($request->validated('return_notes') ?? ''),
                    'performed_at' => now()->toDateString(),
                    'photos' => $request->validated('photos'),
                ]);

                $equipment->logEvent(
                    'maintenance_started',
                    "Sent to Maintenance",
                    "Maintenance triggered due to return condition '{$returnCondition}'.",
                    $supervisorName
                );
            }
        });

        return EquipmentResource::make($equipment->fresh(['assignedEmployee', 'checkouts.employee', 'histories']));
    }

    public function storeMaintenanceLog(StoreMaintenanceLogRequest $request, Equipment $equipment)
    {
        $log = null;

        DB::transaction(function () use ($request, $equipment, &$log) {
            $log = $equipment->maintenanceLogs()->create([
                ...$request->validated(),
                'logged_by' => $request->user()?->employee_id ?? $request->user()?->id,
            ]);

            $newStatus = $request->boolean('in_progress') ? 'Under Maintenance' : $equipment->status;

            $equipment->update([
                'last_maintenance_date' => $request->validated('performed_at'),
                'next_maintenance_due' => $request->validated('next_due_at'),
                'status' => $newStatus,
            ]);

            $equipment->logEvent(
                'maintenance_started',
                "Maintenance Logged: " . ($request->validated('type') ?? 'Service'),
                $request->validated('description') ?? 'Maintenance procedure recorded',
                auth()->user()?->name ?? 'Supervisor'
            );
        });

        return MaintenanceLogResource::make($log->load('loggedBy'))->response()->setStatusCode(Response::HTTP_CREATED);
    }

    public function completeMaintenance(Equipment $equipment)
    {
        if (!in_array($equipment->status, ['Under Maintenance', 'Maintenance'], true)) {
            return response()->json(['message' => 'This equipment is not currently under maintenance.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $equipment->update(['status' => 'Available']);

        $equipment->logEvent(
            'maintenance_completed',
            'Maintenance Completed',
            'Equipment serviced, inspected and returned to Available status.',
            auth()->user()?->name ?? 'Supervisor'
        );

        return EquipmentResource::make($equipment->fresh(['assignedEmployee', 'histories']));
    }

    public function qrImage(Request $request, Equipment $equipment)
    {
        $type = $request->query('type', 'tracking');
        $token = ($type === 'checkout') ? $equipment->checkout_qr_code : $equipment->qr_code;
        $actionName = ($type === 'checkout') ? 'CHECK-OUT' : 'CHECK-IN';

        $payload = json_encode([
            'system' => 'Garage ERP',
            'type' => $type,
            'action' => $actionName,
            'equipment_code' => $equipment->equipment_code,
            'equipment_id' => $equipment->id,
            'name' => $equipment->name,
            'token' => $token,
        ]);

        $result = (new Builder(writer: new SvgWriter(), data: $payload, size: 350, margin: 12))->build();
        return response($result->getString(), Response::HTTP_OK)->header('Content-Type', $result->getMimeType());
    }

    public function regenerateQrCode(Equipment $equipment)
    {
        $equipment->update([
            'qr_code' => Equipment::generateQrToken(),
            'checkout_qr_code' => Equipment::generateQrToken(),
        ]);

        $equipment->logEvent(
            'qr_generated',
            'QR Codes Regenerated',
            'Lost/damaged QR labels regenerated with new permanent identity tokens.',
            auth()->user()?->name ?? 'Supervisor'
        );

        return EquipmentResource::make($equipment->fresh(['assignedEmployee', 'histories']));
    }
}