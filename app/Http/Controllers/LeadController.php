<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use App\Models\Customer;


class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::query()->with(['customer', 'assignedTo']);

        if ($request->has('status')) {
            $query->where('status', $request->status);// when the status filter is provided, filter leads by the given status
        }

        if ($request->has('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);//it will filter leads by the user they are assigned to
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));//it will return the leads in descending order of creation date and paginate the results based on the per_page parameter provided in the request, defaulting to 20 if not specified
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|integer|exists:customers,customer_id',
            'source' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:30',
            'assigned_to' => 'required|integer|exists:users,user_id',
        ]);

        $lead = Lead::create($validated);
        return response()->json($lead, 201);
    }

    public function show(Lead $lead)
    {
        return $lead->load(['customer', 'assignedTo']);
    }

    public function update(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|integer|exists:customers,customer_id',
            'source' => 'nullable|string|max:50',
            'status' => 'nullable|string|max:30',
            'assigned_to' => 'sometimes|required|integer|exists:users,user_id',
        ]);

        $lead->update($validated);
        return $lead;
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->noContent();
    }

    public function convertToCustomer(Lead $lead)
    {
        if ($lead->customer_id) {
            return response()->json([
                'message' => 'Lead already converted to customer',
                'customer' => $lead->customer
            ]);
        }

        // Create customer from lead data
        // This is a simplified example - you would need to get more data
        $customer = Customer::create([
            'name' => 'Converted Customer',
            'branch_id' => 1, // Default branch
            'segment' => 'walk-in',
        ]);

        $lead->update(['customer_id' => $customer->customer_id, 'status' => 'converted']);

        return response()->json([
            'message' => 'Lead converted to customer successfully',
            'customer' => $customer,
            'lead' => $lead
        ]);
    }
}