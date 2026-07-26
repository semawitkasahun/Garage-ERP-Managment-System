<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::query()->with(['customer', 'vehicle', 'branch', 'bay', 'technician']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('scheduled_start', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('scheduled_start', '<=', $request->to_date);
        }

        if ($request->has('is_walkin')) {
            $query->where('is_walkin', $request->boolean('is_walkin'));
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'bay_id' => 'nullable|integer|exists:bays,bay_id',
            'technician_id' => 'nullable|integer|exists:users,user_id',
            'service_type' => 'nullable|string|max:50',
            'scheduled_start' => 'required|date',
            'scheduled_end' => 'nullable|date|after:scheduled_start',
            'status' => 'nullable|string|max:20',
            'is_walkin' => 'sometimes|boolean',
        ]);

        // Set default status if not provided
        if (!isset($validated['status'])) {
            $validated['status'] = 'booked';
        }

        $appointment = Appointment::create($validated);
        return response()->json($appointment, 201);
    }

    public function show(Appointment $appointment)
    {
        return $appointment->load([
            'customer',
            'vehicle',
            'branch',
            'bay',
            'technician',
            'vehicleCheckins'
        ]);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'customer_id' => 'sometimes|required|integer|exists:customers,customer_id',
            'vehicle_id' => 'sometimes|required|integer|exists:vehicles,vehicle_id',
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'bay_id' => 'nullable|integer|exists:bays,bay_id',
            'technician_id' => 'nullable|integer|exists:users,user_id',
            'service_type' => 'nullable|string|max:50',
            'scheduled_start' => 'sometimes|required|date',
            'scheduled_end' => 'nullable|date|after:scheduled_start',
            'status' => 'nullable|string|max:20',
            'is_walkin' => 'sometimes|boolean',
        ]);

        $appointment->update($validated);
        return $appointment;
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return response()->noContent();
    }

    public function confirm(Appointment $appointment)
    {
        $appointment->update(['status' => 'confirmed']);
        return $appointment;
    }

    public function cancel(Appointment $appointment)
    {
        $appointment->update(['status' => 'cancelled']);
        return $appointment;
    }

    public function complete(Appointment $appointment)
    {
        $appointment->update(['status' => 'completed']);
        return $appointment;
    }

    public function getCalendarEvents(Request $request)
    {
        $validated = $request->validate([
            'start' => 'required|date',
            'end' => 'required|date|after:start',
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
        ]);

        $query = Appointment::with(['customer', 'vehicle', 'technician'])
            ->whereBetween('scheduled_start', [$validated['start'], $validated['end']]);

        if (isset($validated['branch_id'])) {
            $query->where('branch_id', $validated['branch_id']);
        }

        $appointments = $query->get();

        return $appointments->map(function ($appointment) {
            return [
                'id' => $appointment->appointment_id,
                'title' => $appointment->customer->name . ' - ' . ($appointment->service_type ?? 'Service'),
                'start' => $appointment->scheduled_start,
                'end' => $appointment->scheduled_end,
                'status' => $appointment->status,
                'customer' => $appointment->customer->name,
                'vehicle' => $appointment->vehicle->plate_number ?? $appointment->vehicle->make . ' ' . $appointment->vehicle->model,
                'technician' => $appointment->technician?->name,
                'color' => $this->getStatusColor($appointment->status),
            ];
        });
    }

    private function getStatusColor($status)
    {
        $colors = [
            'booked' => '#3490dc',
            'confirmed' => '#38c172',
            'cancelled' => '#e3342f',
            'completed' => '#6cb2eb',
            'no_show' => '#ffed4a',
        ];
        return $colors[$status] ?? '#6c757d';
    }
}