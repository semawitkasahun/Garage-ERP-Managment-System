<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query()->with(['branch', 'vehicles']);

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('phone', 'like', '%' . $request->search . '%')
                ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        if ($request->has('segment')) {
            $query->where('segment', $request->segment);
        }

        if ($request->has('customer_type')) {
            $query->where('customer_type', $request->customer_type);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_type' => 'nullable|string|max:20',
            'name' => 'required|string|max:150',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'address' => 'nullable|string|max:255',
            'segment' => 'nullable|string|max:30',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'opt_in_sms' => 'sometimes|boolean',
            'opt_in_email' => 'sometimes|boolean',
        ]);

        $customer = Customer::create($validated);
        return response()->json($customer, 201);
    }

    public function show(Customer $customer)
    {
        return $customer->load([
            'branch',
            'vehicles',
            'appointments',
            'quotations',
            'workOrders',
            'invoices',
            'payments',
            'complaints',
            'communicationLogs'
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'customer_type' => 'nullable|string|max:20',
            'name' => 'sometimes|required|string|max:150',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'segment' => 'nullable|string|max:30',
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'opt_in_sms' => 'sometimes|boolean',
            'opt_in_email' => 'sometimes|boolean',
        ]);

        $customer->update($validated);
        return $customer;
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->noContent();
    }
}