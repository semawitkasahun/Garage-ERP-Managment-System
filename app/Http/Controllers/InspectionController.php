<?php

namespace App\Http\Controllers;

use App\Models\Inspection;
use Illuminate\Http\Request;

class InspectionController extends Controller
{
    public function index(Request $request)
    {
        $query = Inspection::query()->with(['vehicle', 'technician', 'checkin']);

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('checkin_id')) {
            $query->where('checkin_id', $request->checkin_id);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'checkin_id' => 'nullable|integer|exists:vehicle_checkins,checkin_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'technician_id' => 'required|integer|exists:users,user_id',
            'service_type' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:20',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date|after:started_at',
        ]);

        $inspection = Inspection::create($validated);
        return response()->json($inspection, 201);
    }

    public function show(Inspection $inspection)
    {
        return $inspection->load([
            'checkin',
            'vehicle',
            'technician',
            'findings',
            'quotations'
        ]);
    }

    public function update(Request $request, Inspection $inspection)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date|after:started_at',
        ]);

        $inspection->update($validated);
        return $inspection;
    }

    public function destroy(Inspection $inspection)
    {
        $inspection->delete();
        return response()->noContent();
    }

    public function start(Inspection $inspection)
    {
        $inspection->update([
            'status' => 'in_progress',
            'started_at' => now(),
        ]);
        return $inspection;
    }

    public function complete(Request $request, Inspection $inspection)
    {
        $validated = $request->validate([
            'findings' => 'nullable|array',
        ]);

        $inspection->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Create findings if provided
        if (isset($validated['findings'])) {
            foreach ($validated['findings'] as $finding) {
                $inspection->findings()->create($finding);
            }
        }

        return $inspection->load('findings');
    }

    public function getByVehicle($vehicleId)
    {
        $inspections = Inspection::where('vehicle_id', $vehicleId)
            ->with(['technician', 'findings'])
            ->latest()
            ->get();
        return $inspections;
    }
}