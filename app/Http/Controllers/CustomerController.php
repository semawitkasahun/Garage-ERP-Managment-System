<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    /**
     * List customers (Admin/Owner only)
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasAnyRole(['Admin', 'Owner', 'Supervisor', 'Manager']);

        $query = Customer::query()->with(['vehicles']);

        // Non-admin staff only see their own branch customers
        if (!$isAdmin && $user) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $search . '%'])
                    ->orWhere('phone', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 200));
    }

    /**
     * Create customer with vehicle and user account
     * Accessible by: Technician, Service Advisor, Manager, Supervisor, Admin, Owner
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            // Customer details
            'customer.name' => 'required|string|max:150',
            'customer.email' => 'required|email|max:100|unique:customers,email|unique:users,email',
            'customer.phone' => 'nullable|string|max:30',
            'customer.address' => 'nullable|string|max:255',
            'customer.customer_type' => 'nullable|string|max:20',
            'customer.segment' => 'nullable|string|max:30',
            'customer.branch_id' => 'required|integer|exists:branches,branch_id',

            // Vehicle details
            'vehicle.make' => 'nullable|string|max:50',
            'vehicle.model' => 'nullable|string|max:50',
            'vehicle.year' => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'vehicle.plate_number' => 'nullable|string|max:20',
            'vehicle.vin' => 'nullable|string|max:50|unique:vehicles,vin',
            'vehicle.mileage' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate temporary password
            $tempPassword = Str::random(8) . '1!'; // e.g., "aBcDeFgH1!"

            // Create customer
            $customerData = $request->input('customer');
            $customerData['opt_in_sms'] = $customerData['opt_in_sms'] ?? false;
            $customerData['opt_in_email'] = $customerData['opt_in_email'] ?? true;

            $customer = Customer::create($customerData);

            // Create user account for customer
            $user = User::create([
                'username' => strtolower(str_replace(' ', '_', $customerData['name'])) . '_' . rand(100, 999),
                'email' => $customerData['email'],
                'password_hash' => Hash::make($tempPassword),
                'employee_id' => null, // Customers don't have employee records
                'branch_id' => $customerData['branch_id'],
                'is_active' => true,
            ]);

            // Assign Customer role
            $customerRole = Role::where('name', 'Customer')->first();
            if ($customerRole) {
                $user->roles()->attach($customerRole->role_id);
            }

            // Create vehicle if provided
            $vehicle = null;
            if ($request->has('vehicle') && !empty($request->input('vehicle'))) {
                $vehicleData = $request->input('vehicle');
                $vehicleData['customer_id'] = $customer->customer_id;
                $vehicle = Vehicle::create($vehicleData);
            }

            // Send credentials email
            $this->sendCredentialsEmail($customer, $user, $tempPassword);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully. Login credentials sent to email.',
                'data' => [
                    'customer' => $customer,
                    'vehicle' => $vehicle,
                    'user' => [
                        'user_id' => $user->user_id,
                        'email' => $user->email,
                        'temporary_password' => $tempPassword, // Only shown once
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show customer details
     */
    public function show(Customer $customer)
    {
        // Check if user has permission to view this customer
        $user = auth()->user();
        $isTechnician = $user->hasRole('Technician') || $user->hasRole('Service Advisor');
        $isAdmin = $user->hasAnyRole(['Admin', 'Owner', 'Supervisor', 'Manager']);

        // Technicians can only view customers they created (if we add created_by)
        // For now, let admins view all, technicians view their branch
        if ($isTechnician && $customer->branch_id !== $user->branch_id) {
            return response()->json([
                'message' => 'Unauthorized to view this customer'
            ], 403);
        }

        return $customer->load([
            'branch',
            'vehicles',
            'appointments',
            'quotations',
            'workOrders',
            'invoices',
            'payments'
        ]);
    }

    /**
     * Update customer
     */
    public function update(Request $request, Customer $customer)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:150',
            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:255',
            'email' => 'nullable|string|email|max:100',
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',

            'segment' => 'nullable|string|max:30',
            'opt_in_sms' => 'sometimes|boolean',
            'opt_in_email' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $customer->update($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer
        ]);
    }

    /**
     * Delete customer
     */
    public function destroy(Customer $customer)
    {
        // Check if customer has active appointments or work orders
        if ($customer->appointments()->whereIn('status', ['booked', 'confirmed'])->exists()) {
            return response()->json([
                'message' => 'Cannot delete customer with active appointments'
            ], 422);
        }

        // Delete associated user account
        $user = User::where('email', $customer->email)->first();
        if ($user) {
            $user->delete();
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'Customer deleted successfully'
        ]);
    }

    /**
     * Send credentials to customer
     */
    public function sendCredentials(Request $request, Customer $customer)
    {
        $user = User::where('email', $customer->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User account not found for this customer'
            ], 404);
        }

        // Generate new temporary password
        $tempPassword = Str::random(8) . '1!';
        $user->update([
            'password_hash' => Hash::make($tempPassword)
        ]);

        // Send email
        $this->sendCredentialsEmail($customer, $user, $tempPassword);

        return response()->json([
            'success' => true,
            'message' => 'Credentials sent to customer email',
            'temporary_password' => $tempPassword // Only shown once
        ]);
    }

    /**
     * Send credentials email
     */
    private function sendCredentialsEmail($customer, $user, $password)
    {
        // TODO: Implement actual email sending
        // For now, just log it
        \Log::info('Customer credentials', [
            'customer' => $customer->email,
            'password' => $password,
            'user_id' => $user->user_id,
        ]);

        // When email is set up, uncomment:
        /*
        Mail::to($customer->email)->send(new CustomerCredentialsMail([
            'name' => $customer->name,
            'email' => $customer->email,
            'password' => $password,
            'login_url' => env('FRONTEND_URL') . '/login',
        ]));
        */
    }

    /**
     * Search customers (for technicians)
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Search query is required',
                'errors' => $validator->errors()
            ], 422);
        }

        $searchQuery = $request->input('query');
        $user = auth()->user();
        $isTechnician = $user && $user->hasAnyRole(['Technician', 'Service Advisor']);

        $customers = Customer::with('vehicles')
            ->where(function ($q) use ($searchQuery) {
                $q->where('first_name', 'like', '%' . $searchQuery . '%')
                    ->orWhere('last_name', 'like', '%' . $searchQuery . '%')
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $searchQuery . '%'])
                    ->orWhere('email', 'like', '%' . $searchQuery . '%')
                    ->orWhere('phone', 'like', '%' . $searchQuery . '%');
            });

        // Technicians see only their branch customers
        if ($isTechnician) {
            $customers->where('branch_id', $user->branch_id);
        }

        return $customers->limit(20)->get();
    }
}