<?php

namespace App\Http\Controllers;

use App\Models\VehicleOwnershipHistory;
use Illuminate\Http\Request;

class VehicleOwnershipHistoryController extends Controller
{
    public function index(Request $request)
    {
        $query = VehicleOwnershipHistory::query()->with(['vehicle', 'customer']);

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'owned_from' => 'nullable|date',
            'owned_to' => 'nullable|date|after:owned_from',
        ]);

        $history = VehicleOwnershipHistory::create($validated);
        return response()->json($history, 201);
    }

    public function show(VehicleOwnershipHistory $vehicleOwnershipHistory)
    {
        return $vehicleOwnershipHistory->load(['vehicle', 'customer']);
    }

    public function update(Request $request, VehicleOwnershipHistory $vehicleOwnershipHistory)
    {
        $validated = $request->validate([
            'owned_from' => 'nullable|date',
            'owned_to' => 'nullable|date|after:owned_from',
        ]);

        $vehicleOwnershipHistory->update($validated);
        return $vehicleOwnershipHistory;
    }

    public function destroy(VehicleOwnershipHistory $vehicleOwnershipHistory)
    {
        $vehicleOwnershipHistory->delete();
        return response()->noContent();
    }
}