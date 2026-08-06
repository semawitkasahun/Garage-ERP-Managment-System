<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadFollowup;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::query()->with(['customer', 'assignedTo']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }
        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->has('source')) {
            $query->where('source', $request->source);
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($request->integer('per_page', 20));
    }

    public function stats()
    {
        $total = Lead::count();
        $converted = Lead::where('status', 'converted')->count();

        return response()->json([
            'total_leads' => $total,
            'new_leads_today' => Lead::whereDate('created_at', now()->toDateString())->count(),
            'qualified_leads' => Lead::where('status', 'qualified')->count(),
            'converted_customers' => $converted,
            'lost_leads' => Lead::where('status', 'lost')->count(),
            'conversion_rate' => $total > 0 ? round(($converted / $total) * 100, 1) : 0,
            'pending_followups' => LeadFollowup::whereNull('completed_at')
                ->whereDate('scheduled_at', '<=', now())
                ->count(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'company' => 'nullable|string|max:150',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:50',
            'interested_service' => 'nullable|string|max:100',
            'expected_budget' => 'nullable|numeric|min:0',
            'preferred_contact_method' => 'nullable|string|max:20',
            'priority' => 'nullable|in:low,medium,high',
            'notes' => 'nullable|string',
            'vehicle_make' => 'nullable|string|max:50',
            'vehicle_model' => 'nullable|string|max:50',
            'vehicle_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'vehicle_plate' => 'nullable|string|max:20',
            'vehicle_vin' => 'nullable|string|max:50',
            'assigned_to' => 'nullable|integer|exists:users,user_id',
        ]);

        $validated['status'] = 'new';
        $lead = Lead::create($validated);

        return response()->json($lead->load(['assignedTo']), 201);
    }

    public function show(Lead $lead)
    {
        return $lead->load(['customer', 'assignedTo', 'followups.createdBy']);
    }

    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'company' => 'nullable|string|max:150',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string|max:255',
            'source' => 'nullable|string|max:50',
            'status' => 'nullable|in:new,contacted,qualified,quotation_sent,negotiating,converted,lost',
            'interested_service' => 'nullable|string|max:100',
            'expected_budget' => 'nullable|numeric|min:0',
            'preferred_contact_method' => 'nullable|string|max:20',
            'priority' => 'nullable|in:low,medium,high',
            'notes' => 'nullable|string',
            'vehicle_make' => 'nullable|string|max:50',
            'vehicle_model' => 'nullable|string|max:50',
            'vehicle_year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'vehicle_plate' => 'nullable|string|max:20',
            'vehicle_vin' => 'nullable|string|max:50',
            'interest_level' => 'nullable|in:low,medium,high',
            'urgency' => 'nullable|in:immediate,this_week,this_month,exploring',
            'is_decision_maker' => 'nullable|boolean',
            'expected_service_date' => 'nullable|date',
            'assigned_to' => 'nullable|integer|exists:users,user_id',
        ]);

        $lead->update($validated);
        return $lead->load(['customer', 'assignedTo']);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->noContent();
    }

    public function markLost(Lead $lead)
    {
        $lead->update(['status' => 'lost']);
        return $lead;
    }

    public function addFollowup(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'scheduled_at' => 'required|date',
            'method' => 'required|in:phone,sms,whatsapp,email,in_person',
            'notes' => 'nullable|string',
            'next_followup_date' => 'nullable|date',
        ]);

        $validated['lead_id'] = $lead->lead_id;
        $validated['created_by'] = $request->user()->user_id;

        $followup = LeadFollowup::create($validated);

        if ($lead->status === 'new') {
            $lead->update(['status' => 'contacted']);
        }

        return response()->json($followup->load('createdBy'), 201);
    }

    public function convertToCustomer(Request $request, Lead $lead)
    {
        if ($lead->customer_id) {
            return response()->json([
                'message' => 'Lead already converted to customer',
                'customer' => $lead->customer,
            ]);
        }

        $validated = $request->validate([
            'create_appointment' => 'sometimes|boolean',
            'scheduled_start' => 'required_if:create_appointment,true|date',
            'bay_id' => 'nullable|integer|exists:bays,bay_id',
        ]);

        $result = DB::transaction(function () use ($lead, $validated, $request) {
            $customer = Customer::create([
                'name' => $lead->name,
                'phone' => $lead->phone,
                'email' => $lead->email,
                'address' => $lead->address,
                'customer_type' => 'individual',
                'segment' => 'walk-in',
                'branch_id' => $request->user()->branch_id,
                'opt_in_sms' => false,
                'opt_in_email' => true,
            ]);

            $vehicle = null;
            if ($lead->vehicle_make || $lead->vehicle_model || $lead->vehicle_plate || $lead->vehicle_vin) {
                $vehicle = Vehicle::create([
                    'customer_id' => $customer->customer_id,
                    'make' => $lead->vehicle_make,
                    'model' => $lead->vehicle_model,
                    'year' => $lead->vehicle_year,
                    'plate_number' => $lead->vehicle_plate,
                    'vin' => $lead->vehicle_vin,
                ]);
            }

            $appointment = null;
            if ($request->boolean('create_appointment') && $vehicle) {
                $appointment = Appointment::create([
                    'customer_id' => $customer->customer_id,
                    'vehicle_id' => $vehicle->vehicle_id,
                    'branch_id' => $request->user()->branch_id,
                    'bay_id' => $validated['bay_id'] ?? null,
                    'service_type' => $lead->interested_service ?? 'General Service',
                    'scheduled_start' => $validated['scheduled_start'],
                    'scheduled_end' => date('Y-m-d H:i:s', strtotime($validated['scheduled_start'] . ' +1 hour')),
                    'status' => 'booked',
                    'is_walkin' => false,
                ]);
            }

            $lead->update(['customer_id' => $customer->customer_id, 'status' => 'converted']);

            return ['customer' => $customer, 'vehicle' => $vehicle, 'appointment' => $appointment];
        });

        return response()->json([
            'message' => 'Lead converted to customer successfully',
            'customer' => $result['customer'],
            'vehicle' => $result['vehicle'],
            'appointment' => $result['appointment'],
            'lead' => $lead->fresh(),
        ]);
    }
}