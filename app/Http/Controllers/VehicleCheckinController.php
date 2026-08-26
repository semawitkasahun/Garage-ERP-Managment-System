<?php

namespace App\Http\Controllers;

use App\Models\VehicleCheckin;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class VehicleCheckinController extends Controller
{
    public function index(Request $request)
    {
        $query = VehicleCheckin::query()->with([
            'vehicle',
            'customer',
            'branch',
            'checkedInBy',
            'appointment',
            'checkinInspection',
            'workOrder',
        ]);

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('checked_in_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('checked_in_at', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 50));
    }

    public function getTodayStatus(Request $request)
    {
        $branchId = $request->input('branch_id', $request->user()?->branch_id ?? 1);
        $date = $request->input('date', today()->toDateString());

        // 1. Vehicles checked in
        $checkedInQuery = VehicleCheckin::with([
            'vehicle',
            'customer',
            'branch',
            'checkedInBy',
            'appointment',
            'checkinInspection',
            'workOrder',
        ])
        ->where('branch_id', $branchId);

        if ($request->filled('date')) {
            $checkedInQuery->whereDate('checked_in_at', $date);
        }

        $checkedIn = $checkedInQuery->latest('checked_in_at')->get();

        // 2. Expected appointments for date that are not checked in yet
        $expectedAppointments = Appointment::with([
            'customer',
            'vehicle',
            'bay',
            'technician.employee',
        ])
        ->where('branch_id', $branchId)
        ->whereDate('scheduled_start', $date)
        ->whereIn('status', ['booked', 'confirmed'])
        ->orderBy('scheduled_start', 'asc')
        ->get();

        // 3. Daily Summary Metrics
        $totalCheckedIn = $checkedIn->count();
        $totalExpected = $expectedAppointments->count();
        $inspectionsCompleted = $checkedIn->filter(fn ($c) => $c->checkin_status === 'completed' || $c->inspection_completed_at)->count();
        $workOrdersCreated = $checkedIn->filter(fn ($c) => !empty($c->work_order_id))->count();

        return response()->json([
            'date' => $date,
            'checked_in' => $checkedIn,
            'expected_today' => $expectedAppointments,
            'summary' => [
                'total_checked_in' => $totalCheckedIn,
                'total_expected' => $totalExpected,
                'inspections_completed' => $inspectionsCompleted,
                'work_orders_created' => $workOrdersCreated,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'nullable|integer|exists:appointments,appointment_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'branch_id' => 'nullable|integer|exists:branches,branch_id', // defaults to staff's own branch below
            'mileage_in' => 'nullable|integer|min:0',
            'fuel_level' => 'nullable|string|max:10',
            'customer_complaint' => 'nullable|string',
            'key_tag_number' => 'nullable|string|max:30',
            'requested_services' => 'nullable|array',
            'inspection_notes' => 'nullable|string',
            'checklist_items' => 'nullable|array|min:1',
            'checklist_items.*.item_name' => 'required|string|max:100',
            'checklist_items.*.status' => 'required|in:ok,damaged,na',
            'checklist_items.*.notes' => 'nullable|string|max:255',
        ]);

        $checkin = DB::transaction(function () use ($validated, $request) {
            $checkin = VehicleCheckin::create([
                'appointment_id' => $validated['appointment_id'] ?? null,
                'vehicle_id' => $validated['vehicle_id'],
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'] ?? $request->user()->branch_id,
                'mileage_in' => $validated['mileage_in'] ?? null,
                'fuel_level' => $validated['fuel_level'] ?? null,
                'customer_complaint' => $validated['customer_complaint'] ?? null,
                'key_tag_number' => $validated['key_tag_number'] ?? null,
                'inspection_notes' => $validated['inspection_notes'] ?? null,
                'checked_in_by' => $request->user()->user_id, // always the authenticated staff member, never client-supplied
                'checked_in_at' => now(),
                'checkin_status' => 'in_progress',
            ]);

            // Create checklist items if provided (legacy support)
            if (isset($validated['checklist_items'])) {
                foreach ($validated['checklist_items'] as $item) {
                    $checkin->checklistItems()->create([
                        'item_name' => $item['item_name'],
                        'status' => $item['status'],
                        'notes' => $item['notes'] ?? null,
                    ]);
                }
            }

            if (isset($validated['appointment_id'])) {
                $appointment = Appointment::find($validated['appointment_id']);
                if ($appointment && in_array($appointment->status, ['booked', 'confirmed'])) {
                    $appointment->update(['status' => 'checked_in']);
                }
            }

            return $checkin;
        });

        return response()->json([
            'message' => 'Vehicle checked in successfully',
            'checkin' => $checkin->load(['vehicle', 'customer', 'checklistItems']),
        ], 201);
    }

    public function show(VehicleCheckin $vehicleCheckin)
    {
        return $vehicleCheckin->load([
            'vehicle',
            'customer',
            'branch',
            'checkedInBy',
            'appointment',
            'checklistItems',
            'media',
            'inspections',
        ]);
    }

    public function update(Request $request, VehicleCheckin $vehicleCheckin)
    {
        $validated = $request->validate([
            'mileage_in' => 'nullable|integer|min:0',
            'fuel_level' => 'nullable|string|max:10',
            'customer_complaint' => 'nullable|string',
            'signature_file' => 'nullable|string|max:255',
            'key_tag_number' => 'nullable|string|max:30',
        ]);

        $vehicleCheckin->update($validated);
        return $vehicleCheckin;
    }

    public function destroy(VehicleCheckin $vehicleCheckin)
    {
        $vehicleCheckin->delete();
        return response()->noContent();
    }

    public function uploadMedia(Request $request, VehicleCheckin $vehicleCheckin)
    {
        $validated = $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:jpg,jpeg,png,mp4,mov,webm|max:25600',
        ]);

        $records = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store("checkins/{$vehicleCheckin->checkin_id}", 'public');
            $isVideo = str_starts_with($file->getMimeType(), 'video');

            $records[] = $vehicleCheckin->media()->create([
                'file_path' => Storage::url($path),
                'media_type' => $isVideo ? 'video' : 'photo',
                'captured_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Media uploaded', 'media' => $records], 201);
    }

    public function uploadSignature(Request $request, VehicleCheckin $vehicleCheckin)
    {
        $request->validate(['signature' => 'required|string']);

        if (!preg_match('/^data:image\/(\w+);base64,/', $request->signature, $matches)) {
            return response()->json(['message' => 'Invalid signature format'], 422);
        }

        $binary = base64_decode(substr($request->signature, strpos($request->signature, ',') + 1));
        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $filename = "checkins/{$vehicleCheckin->checkin_id}/signature.{$extension}";

        Storage::disk('public')->put($filename, $binary);
        $vehicleCheckin->update(['signature_file' => Storage::url($filename)]);

        return response()->json(['message' => 'Signature saved', 'checkin' => $vehicleCheckin]);
    }

    public function getCheckinForm($appointmentId)
    {
        $appointment = Appointment::with([
            'customer',
            'vehicle',
            'technician.employee',
            'bay',
            'branch',
        ])->findOrFail($appointmentId);

        return response()->json([
            'appointment' => $appointment,
            'checklist_items' => $this->getDefaultChecklistItems(),
        ]);
    }

    private function getDefaultChecklistItems()
    {
        return collect(['Exterior', 'Interior', 'Fuel', 'Existing Damage', 'Tires', 'Lights', 'Windshield', 'Odometer'])
            ->map(fn ($name) => ['item_name' => $name, 'status' => 'ok', 'notes' => null])
            ->values();
    }

    public function createWorkOrder(Request $request, VehicleCheckin $vehicleCheckin)
    {
        try {
            // Check if work order already exists
            if ($vehicleCheckin->workOrder) {
                return response()->json([
                    'message' => 'Work Order already exists for this Check-In.',
                    'work_order' => $vehicleCheckin->workOrder
                ], 400);
            }

            $validated = $request->validate([
                'supervisor_id' => 'nullable|integer|exists:users,user_id',
                'service_advisor_id' => 'nullable|integer|exists:users,user_id',
                'priority' => 'nullable|in:low,normal,high,urgent',
            ]);

            $workOrder = DB::transaction(function () use ($vehicleCheckin, $validated, $request) {
                // Generate work order number
                $sequence = \App\Models\NumberingSequence::where('entity_type', 'work_orders')->first();
                
                // Create sequence if it doesn't exist
                if (!$sequence) {
                    $sequence = \App\Models\NumberingSequence::create([
                        'entity_type' => 'work_orders',
                        'prefix' => 'WO',
                        'next_number' => 1,
                    ]);
                }
                
                $workOrderNumber = $sequence->getNextNumber();

                $workOrder = \App\Models\WorkOrder::create([
                    'work_order_number' => $workOrderNumber,
                    'checkin_id' => $vehicleCheckin->checkin_id,
                    'appointment_id' => $vehicleCheckin->appointment_id,
                    'vehicle_id' => $vehicleCheckin->vehicle_id,
                    'customer_id' => $vehicleCheckin->customer_id,
                    'branch_id' => $vehicleCheckin->branch_id,
                    'supervisor_id' => $validated['supervisor_id'] ?? $request->user()->user_id,
                    'service_advisor_id' => $validated['service_advisor_id'] ?? null,
                    'priority' => $validated['priority'] ?? 'normal',
                    'status' => 'draft',
                ]);

                // Update checkin with work order reference
                $vehicleCheckin->update(['work_order_id' => $workOrder->work_order_id]);

                // Log activity
                \App\Models\WorkOrderActivity::create([
                    'work_order_id' => $workOrder->work_order_id,
                    'action' => 'work_order_created',
                    'description' => 'Work Order created from Check-In',
                    'performed_by' => $request->user()->user_id,
                    'performed_at' => now(),
                    'new_values' => $workOrder->toArray(),
                ]);

                // Auto generate initial Job Card(s) for the services
                app(\App\Http\Controllers\WorkOrderController::class)->autoGenerateJobCards($workOrder, $validated, $request);

                return $workOrder;
            });

            return response()->json($workOrder->load(['checkin', 'vehicle', 'customer', 'supervisor', 'jobCards']), 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create work order: ' . $e->getMessage(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}