<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Customer;
use App\Models\Appointment;
use App\Models\Vehicle;
use App\Models\Branch;
use App\Models\Bay;
use App\Models\User;
use Carbon\Carbon;

class CustomerAppointmentController extends Controller
{
    /**
     * Get all appointments for the logged-in customer
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

        $appointments = Appointment::where('customer_id', $customer->customer_id)
            ->with(['vehicle', 'branch', 'technician'])
            ->orderBy('scheduled_start', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data' => $appointments,
        ]);
    }

    /**
     * Get upcoming appointments
     */
    public function upcoming(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $appointments = Appointment::where('customer_id', $customer->customer_id)
            ->where('scheduled_start', '>=', Carbon::now())
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->with(['vehicle', 'branch', 'technician'])
            ->orderBy('scheduled_start', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $appointments,
        ]);
    }

    /**
     * Book a new appointment (Customer self-service)
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'scheduled_start' => 'required|date|after:now',
            'service_type' => 'nullable|string|max:50',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if vehicle belongs to customer
        $vehicle = Vehicle::where('vehicle_id', $request->vehicle_id)
            ->where('customer_id', $customer->customer_id)
            ->first();

        if (!$vehicle) {
            return response()->json([
                'success' => false,
                'message' => 'Vehicle does not belong to this customer',
            ], 403);
        }

        // Check for conflicting appointments
        $conflict = Appointment::where('branch_id', $request->branch_id)
            ->where('scheduled_start', '<=', $request->scheduled_start)
            ->where('scheduled_end', '>=', $request->scheduled_start)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Time slot is not available. Please choose another time.',
            ], 422);
        }

        // ✅ AUTO-ASSIGN TECHNICIAN
        $technician = $this->getAvailableTechnician(
            $request->branch_id,
            $request->scheduled_start
        );

        if (!$technician) {
            return response()->json([
                'success' => false,
                'message' => 'No technician available at this time. Please choose another time.',
            ], 422);
        }

        // Get available bay
        $bay = Bay::where('branch_id', $request->branch_id)
            ->where('is_active', true)
            ->first();

        // Create appointment
        $appointment = Appointment::create([
            'customer_id' => $customer->customer_id,
            'vehicle_id' => $request->vehicle_id,
            'branch_id' => $request->branch_id,
            'bay_id' => $bay?->bay_id,
            'technician_id' => $technician->user_id, // ✅ Auto-assigned
            'service_type' => $request->service_type ?? 'General Service',
            'scheduled_start' => $request->scheduled_start,
            'scheduled_end' => Carbon::parse($request->scheduled_start)->addHours(2),
            'status' => 'booked',
            'is_walkin' => false,
            'notes' => $request->notes,
        ]);

        // Load relationships
        $appointment->load(['vehicle', 'branch', 'bay', 'technician']);

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully! Assigned to: ' . $technician->name,
            'data' => $appointment,
        ], 201);
    }

    /**
     * Get a specific appointment
     */
    public function show(Request $request, $appointmentId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $appointment = Appointment::where('customer_id', $customer->customer_id)
            ->where('appointment_id', $appointmentId)
            ->with(['vehicle', 'branch', 'technician', 'workOrder'])
            ->first();

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $appointment,
        ]);
    }

    /**
     * Cancel an appointment
     */
    public function cancel(Request $request, $appointmentId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $appointment = Appointment::where('customer_id', $customer->customer_id)
            ->where('appointment_id', $appointmentId)
            ->first();

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found',
            ], 404);
        }

        if (in_array($appointment->status, ['cancelled', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'This appointment cannot be cancelled',
            ], 422);
        }

        $appointment->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled successfully',
            'data' => $appointment,
        ]);
    }

    /**
     * Reschedule an appointment
     */
    public function reschedule(Request $request, $appointmentId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'scheduled_start' => 'required|date|after:now',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $appointment = Appointment::where('customer_id', $customer->customer_id)
            ->where('appointment_id', $appointmentId)
            ->first();

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'Appointment not found',
            ], 404);
        }

        if (in_array($appointment->status, ['cancelled', 'completed'])) {
            return response()->json([
                'success' => false,
                'message' => 'This appointment cannot be rescheduled',
            ], 422);
        }

        // Check for conflicts
        $conflict = Appointment::where('branch_id', $appointment->branch_id)
            ->where('scheduled_start', '<=', $request->scheduled_start)
            ->where('scheduled_end', '>=', $request->scheduled_start)
            ->where('appointment_id', '!=', $appointmentId)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->exists();

        if ($conflict) {
            return response()->json([
                'success' => false,
                'message' => 'Time slot is not available',
            ], 422);
        }

        // ✅ Reassign technician for new time
        $technician = $this->getAvailableTechnician(
            $appointment->branch_id,
            $request->scheduled_start,
            $appointmentId
        );

        if (!$technician) {
            return response()->json([
                'success' => false,
                'message' => 'No technician available at this time. Please choose another time.',
            ], 422);
        }

        $appointment->update([
            'scheduled_start' => $request->scheduled_start,
            'scheduled_end' => Carbon::parse($request->scheduled_start)->addHours(2),
            'technician_id' => $technician->user_id,
            'status' => 'booked',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment rescheduled successfully! Assigned to: ' . $technician->name,
            'data' => $appointment,
        ]);
    }

    /**
     * Get available time slots
     */
    public function availableSlots(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'date' => 'required|date|after:today',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $date = Carbon::parse($request->date);
        $branchId = $request->branch_id;

        $slots = [];
        $start = $date->copy()->setTime(9, 0);
        $end = $date->copy()->setTime(17, 0);

        while ($start < $end) {
            $slotEnd = $start->copy()->addHour();

            // Check if slot is available
            $isBooked = Appointment::where('branch_id', $branchId)
                ->where('scheduled_start', '<=', $slotEnd)
                ->where('scheduled_end', '>=', $start)
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->exists();

            // Check if technician available
            $hasTechnician = $this->getAvailableTechnician($branchId, $start) !== null;

            $slots[] = [
                'start' => $start->format('H:i'),
                'end' => $slotEnd->format('H:i'),
                'available' => !$isBooked && $hasTechnician,
            ];

            $start->addHour();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $date->format('Y-m-d'),
                'slots' => $slots,
            ],
        ]);
    }

    /**
     * ✅ Get available technician for a given time slot
     */
    private function getAvailableTechnician($branchId, $scheduledStart, $excludeAppointmentId = null)
    {
        $scheduledEnd = Carbon::parse($scheduledStart)->addHours(2);

        // Get all technicians in the branch
        $technicians = User::whereHas('roles', function ($q) {
            $q->where('name', 'Technician');
        })
            ->where('branch_id', $branchId)
            ->where('is_active', true)
            ->get();

        foreach ($technicians as $technician) {
            // Check if technician has conflicting appointment
            $hasConflict = Appointment::where('technician_id', $technician->user_id)
                ->where(function ($query) use ($scheduledStart, $scheduledEnd) {
                    $query->whereBetween('scheduled_start', [$scheduledStart, $scheduledEnd])
                        ->orWhereBetween('scheduled_end', [$scheduledStart, $scheduledEnd])
                        ->orWhere(function ($q) use ($scheduledStart, $scheduledEnd) {
                            $q->where('scheduled_start', '<=', $scheduledStart)
                                ->where('scheduled_end', '>=', $scheduledEnd);
                        });
                })
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->when($excludeAppointmentId, function ($q) use ($excludeAppointmentId) {
                    $q->where('appointment_id', '!=', $excludeAppointmentId);
                })
                ->exists();

            if (!$hasConflict) {
                return $technician;
            }
        }

        return null;
    }
}