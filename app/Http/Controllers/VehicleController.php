<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = Vehicle::query()->with(['customer']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('make')) {
            $query->where('make', 'like', '%' . $request->make . '%');
        }

        if ($request->has('model')) {
            $query->where('model', 'like', '%' . $request->model . '%');
        }

        if ($request->has('plate_number')) {
            $query->where('plate_number', 'like', '%' . $request->plate_number . '%');
        }

        if ($request->has('vin')) {
            $query->where('vin', 'like', '%' . $request->vin . '%');
        }

        if ($request->has('year')) {
            $query->where('year', $request->year);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('make', 'like', '%' . $search . '%')
                  ->orWhere('model', 'like', '%' . $search . '%')
                  ->orWhere('plate_number', 'like', '%' . $search . '%')
                  ->orWhere('vin', 'like', '%' . $search . '%');
            });
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'vin' => 'required|string|max:50|unique:vehicles,vin',
            'plate_number' => 'nullable|string|max:20',
            'make' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:50',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'engine_number' => 'nullable|string|max:50',
            'chassis_number' => 'nullable|string|max:50',
            'mileage' => 'nullable|integer|min:0',
            'warranty_expiry' => 'nullable|date',
        ]);

        $vehicle = Vehicle::create($validated);
        return response()->json($vehicle, 201);
    }

    public function show(Vehicle $vehicle)
    {
        return $vehicle->load([
            'customer',
            'appointments',
            'vehicleCheckins',
            'inspections',
            'quotations',
            'workOrders',
            'ownershipHistory'
        ]);
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'customer_id' => 'sometimes|required|integer|exists:customers,customer_id',
            'vin' => 'sometimes|required|string|max:50|unique:vehicles,vin,' . $vehicle->vehicle_id . ',vehicle_id',
            'plate_number' => 'nullable|string|max:20',
            'make' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:50',
            'year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'engine_number' => 'nullable|string|max:50',
            'chassis_number' => 'nullable|string|max:50',
            'mileage' => 'nullable|integer|min:0',
            'warranty_expiry' => 'nullable|date',
        ]);

        $vehicle->update($validated);
        return $vehicle;
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();
        return response()->noContent();
    }

    public function updateMileage(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'mileage' => 'required|integer|min:' . $vehicle->mileage,
        ]);

        $vehicle->update(['mileage' => $validated['mileage']]);
        return $vehicle;
    }

    public function getByCustomer($customerId)
    {
        $vehicles = Vehicle::where('customer_id', $customerId)
            ->with(['customer'])
            ->latest()
            ->get();
        return $vehicles;
    }

    public function getVehicleHistory($vehicleId)
    {
        $vehicle = Vehicle::with([
            'ownershipHistory.customer',
            'appointments',
            'workOrders.jobCards',
            'inspections',
            'quotations'
        ])->findOrFail($vehicleId);

        return $vehicle;
    }
}