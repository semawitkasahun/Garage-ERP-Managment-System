<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Appointment;

class CustomerVehicleController extends Controller
{
    /**
     * Get all vehicles for the logged-in customer
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $vehicles = Vehicle::where('customer_id', $customer->customer_id)
            ->with(['appointments' => function($q) {
                $q->with(['workOrder', 'branch'])
                  ->orderBy('scheduled_start', 'desc')
                  ->limit(5);
            }])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $vehicles,
        ]);
    }

    /**
     * Get specific vehicle details with full history
     */
    public function show(Request $request, $vehicleId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $vehicle = Vehicle::where('customer_id', $customer->customer_id)
            ->where('vehicle_id', $vehicleId)
            ->with([
                'appointments' => function($q) {
                    $q->with(['workOrder', 'branch', 'technician'])
                      ->orderBy('scheduled_start', 'desc');
                },
                'inspections',
                'workOrders' => function($q) {
                    $q->with(['jobCards', 'delivery'])
                      ->orderBy('created_at', 'desc');
                }
            ])
            ->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $vehicle,
        ]);
    }

    /**
     * Get vehicle service history
     */
    public function serviceHistory(Request $request, $vehicleId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $history = Appointment::where('customer_id', $customer->customer_id)
            ->where('vehicle_id', $vehicleId)
            ->where('status', 'completed')
            ->with(['workOrder' => function($q) {
                $q->with(['jobCards', 'delivery']);
            }])
            ->orderBy('scheduled_start', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }

    /**
     * Get vehicle maintenance schedule
     */
    public function maintenanceSchedule(Request $request, $vehicleId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $vehicle = Vehicle::where('customer_id', $customer->customer_id)
            ->where('vehicle_id', $vehicleId)
            ->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle not found',
            ], 404);
        }

        // Calculate maintenance schedule based on mileage
        $schedule = [
            'current_mileage' => $vehicle->mileage,
            'next_oil_change' => $vehicle->mileage + 5000,
            'next_tire_rotation' => $vehicle->mileage + 10000,
            'next_brake_inspection' => $vehicle->mileage + 15000,
            'next_tune_up' => $vehicle->mileage + 30000,
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'vehicle' => $vehicle,
                'schedule' => $schedule,
            ],
        ]);
    }
}