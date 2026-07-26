<?php

namespace App\Http\Controllers;

use App\Models\VehicleCheckin;
use Illuminate\Http\Request;
use App\Models\Appointment;

class VehicleCheckinController extends Controller
{
    public function index(Request $request)
    {
        $query = VehicleCheckin::query()->with(['vehicle', 'customer', 'branch', 'checkedInBy', 'appointment']);

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
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'appointment_id' => 'nullable|integer|exists:appointments,appointment_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'mileage_in' => 'nullable|integer|min:0',
            'fuel_level' => 'nullable|string|max:10',
            'customer_complaint' => 'nullable|string',
            'signature_file' => 'nullable|string|max:255',
            'key_tag_number' => 'nullable|string|max:30',
            'checked_in_by' => 'required|integer|exists:users,user_id',
        ]);

        $checkin = VehicleCheckin::create($validated);
        return response()->json($checkin, 201);
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
            'inspections'
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

    public function getCheckinForm($appointmentId)
    {
        $appointment = Appointment::with(['customer', 'vehicle'])->findOrFail($appointmentId);

        return response()->json([
            'appointment' => $appointment,
            'checklist_items' => $this->getDefaultChecklistItems(),
        ]);
    }

    private function getDefaultChecklistItems()
    {
        return [
            'exterior' => ['condition' => 'ok', 'notes' => null],
            'interior' => ['condition' => 'ok', 'notes' => null],
            'fuel' => ['condition' => 'ok', 'notes' => null],
            'existing_damage' => ['condition' => 'ok', 'notes' => null],
            'tires' => ['condition' => 'ok', 'notes' => null],
            'lights' => ['condition' => 'ok', 'notes' => null],
            'windshield' => ['condition' => 'ok', 'notes' => null],
            'odometer' => ['condition' => 'ok', 'notes' => null],
        ];
    }
}