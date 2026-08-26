<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'date'       => 'required_without_all:start_date,end_date|date_format:Y-m-d',
            'start_date' => 'required_with:end_date|date_format:Y-m-d',
            'end_date'   => 'required_with:start_date|date_format:Y-m-d|after_or_equal:start_date',
            'branch_id'  => 'nullable|integer|exists:branches,branch_id',
            'status'     => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $branchId = $request->input('branch_id', $request->user()->branch_id);

        $rangeStart = $request->filled('start_date')
            ? $request->start_date . ' 00:00:00'
            : $request->date . ' 00:00:00';
        $rangeEnd = $request->filled('end_date')
            ? $request->end_date . ' 23:59:59'
            : $request->date . ' 23:59:59';

        $query = Appointment::with(['customer', 'vehicle', 'bay', 'technician.employee'])
            ->where('branch_id', $branchId)
            ->whereBetween('scheduled_start', [$rangeStart, $rangeEnd]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return $query->orderBy('scheduled_start')->get();
    }

    public function technicians(Request $request)
    {
        $branchId = $request->input('branch_id', $request->user()?->branch_id);

        // Query from Employee table to get only active employees
        $query = \App\Models\Employee::where('employment_status', 'active')
            ->with('user');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $employees = $query->get();

        return response()->json($employees->map(function ($e) {
            $name = trim("{$e->first_name} {$e->last_name}");
            return [
                'user_id' => $e->user_id ?? $e->employee_id,
                'employee_id' => $e->employee_id,
                'name' => $name,
                'username' => $e->user?->username ?? $name,
                'email' => $e->email,
                'job_title' => $e->job_title,
            ];
        }));
    }

    public function store(Request $request)
    {
        $branchId = $request->input('branch_id', $request->user()->branch_id);

        $customerId = $request->customer_id;
        if (!$customerId && ($request->filled('customer_first_name') || $request->filled('customer_name'))) {
            $firstName = $request->customer_first_name;
            $lastName = $request->customer_last_name;

            if (!$firstName && $request->filled('customer_name')) {
                $parts = explode(' ', trim($request->customer_name), 2);
                $firstName = $parts[0];
                $lastName = $parts[1] ?? 'Customer';
            }

            $customer = \App\Models\Customer::create([
                'first_name' => $firstName,
                'last_name' => $lastName ?? 'Customer',
                'email' => $request->customer_email,
                'phone' => $request->customer_phone,
                'address' => $request->customer_address,
                'customer_type' => 'individual',
                'segment' => 'regular',
                'branch_id' => $branchId,
                'opt_in_sms' => false,
                'opt_in_email' => true,
            ]);
            $customerId = $customer->customer_id;
        }

        $vehicleId = $request->vehicle_id;
        if (!$vehicleId && ($request->filled('vin') || $request->filled('vehicle_vin') || $request->filled('vehicle_make') || $request->filled('vehicle_name'))) {
            $vin = $request->vehicle_vin ?: $request->vin ?: ('VIN' . strtoupper(substr(md5(microtime()), 0, 10)));
            $make = $request->vehicle_make;
            $model = $request->vehicle_model;
            $year = $request->vehicle_year ?: (int) date('Y');
            $plateNumber = $request->vehicle_plate_number;
            $mileage = $request->vehicle_mileage;

            if (!$make && $request->filled('vehicle_name')) {
                $vParts = explode(' ', trim($request->vehicle_name), 2);
                $make = $vParts[0] ?? 'Generic';
                $model = $vParts[1] ?? 'Car';
            }

            $existingVehicle = \App\Models\Vehicle::where('vin', $vin)->first();
            if ($existingVehicle) {
                $vehicleId = $existingVehicle->vehicle_id;
            } else {
                $vehicle = \App\Models\Vehicle::create([
                    'customer_id' => $customerId,
                    'vin' => $vin,
                    'make' => $make ?? 'Generic',
                    'model' => $model ?? 'Car',
                    'year' => (int) $year,
                    'plate_number' => $plateNumber,
                    'mileage' => $mileage ? (int) $mileage : null,
                ]);
                $vehicleId = $vehicle->vehicle_id;
            }
        }

        $techId = $request->technician_id;
        if (!$techId && $request->filled('technician_name')) {
            $techUser = \App\Models\User::whereHas('employee', function ($q) use ($request) {
                $q->whereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $request->technician_name . '%']);
            })->orWhere('username', 'LIKE', '%' . $request->technician_name . '%')->first();

            if ($techUser) {
                $techId = $techUser->user_id;
            } else {
                return response()->json([
                    'message' => 'Technician does not exist.',
                    'errors'  => ['technician_name' => ['The technician "' . $request->technician_name . '" does not exist.']],
                ], 422);
            }
        }

        $dataToValidate = array_merge($request->all(), [
            'customer_id' => $customerId,
            'vehicle_id' => $vehicleId,
            'technician_id' => $techId,
        ]);

        $validator = Validator::make($dataToValidate, [
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
            'bay_id' => 'nullable|integer|exists:bays,bay_id',
            'technician_id' => 'nullable|integer|exists:users,user_id',
            'service_type' => 'required|string',
            'scheduled_start' => 'required|date',
            'scheduled_end' => 'nullable|date|after:scheduled_start',
            'is_walkin' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $start = $request->scheduled_start;
        $end = $request->scheduled_end ?? date('Y-m-d H:i:s', strtotime($start . ' +1 hour'));

        // Prevent double-booking the same bay
        if ($request->filled('bay_id')) {
            $conflict = Appointment::where('bay_id', $request->bay_id)
                ->whereIn('status', ['booked', 'confirmed'])
                ->where(fn ($q) => $q->where('scheduled_start', '<', $end)->where('scheduled_end', '>', $start))
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'This bay is already booked for the selected time.'], 422);
            }
        }

        $appointment = Appointment::create([
            'customer_id' => $customerId,
            'vehicle_id' => $vehicleId,
            'branch_id' => $branchId,
            'bay_id' => $request->bay_id,
            'technician_id' => $techId,
            'service_type' => $request->service_type,
            'scheduled_start' => $start,
            'scheduled_end' => $end,
            'status' => 'booked',
            'is_walkin' => $request->boolean('is_walkin', false),
        ]);

        return response()->json([
            'message' => 'Appointment booked successfully',
            'appointment' => $appointment->load(['customer', 'vehicle', 'bay', 'technician']),
        ], 201);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:booked,confirmed,checked_in,in_progress,completed,cancelled,no_show',
            'bay_id' => 'sometimes|nullable|integer|exists:bays,bay_id',
            'technician_id' => 'sometimes|nullable|integer|exists:users,user_id',
            'scheduled_start' => 'sometimes|date',
            'scheduled_end' => 'sometimes|date|after:scheduled_start',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $appointment->update($request->only(['status', 'bay_id', 'technician_id', 'scheduled_start', 'scheduled_end']));

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->load(['customer', 'vehicle', 'bay', 'technician']),
        ]);
    }
}