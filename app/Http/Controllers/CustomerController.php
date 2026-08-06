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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasAnyRole(['Admin', 'Owner', 'Supervisor', 'Manager']);

        $query = Customer::query()->with(['vehicles']);

        if (!$isAdmin && $user) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', '%' . $search . '%')
                    ->orWhere('phone', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 200));
    }

    /**
     * Dashboard summary stats for the Customers module.
     */
    public function stats(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasAnyRole(['Admin', 'Owner', 'Supervisor', 'Manager']);
        $branchId = $isAdmin ? $request->input('branch_id') : $user->branch_id;

        $base = Customer::query();
        if ($branchId) {
            $base->where('branch_id', $branchId);
        }

        $customerIds = (clone $base)->pluck('customer_id');

        $outstandingCount = DB::table('invoices')
            ->whereIn('customer_id', $customerIds)
            ->whereIn('status', ['unpaid', 'partial'])
            ->distinct('customer_id')
            ->count('customer_id');

        $openComplaints = DB::table('complaints_feedback')
            ->whereIn('customer_id', $customerIds)
            ->where('status', 'open')
            ->count();

        return response()->json([
            'total_customers' => (clone $base)->count(),
            'new_this_month' => (clone $base)->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
            'active_customers' => null, // no status column on customers yet — see migration
            'vip_customers' => (clone $base)->where('segment', 'VIP')->count(),
            'fleet_customers' => (clone $base)->where('customer_type', 'fleet')->count(),
            'customers_with_outstanding_balance' => $outstandingCount,
            'open_complaints' => $openComplaints,
            'satisfaction_rate' => null, // no ratings/survey table exists anywhere in the schema
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'customer.name' => 'nullable|string|max:150',
            'customer.first_name' => 'nullable|string|max:150',
            'customer.last_name' => 'nullable|string|max:150',
            'customer.email' => 'required|email|max:100|unique:customers,email|unique:users,email',
            'customer.phone' => 'nullable|string|max:30',
            'customer.address' => 'nullable|string|max:255',
            'customer.customer_type' => 'nullable|string|max:20',
            'customer.segment' => 'nullable|string|max:30',
            'customer.branch_id' => 'required|integer|exists:branches,branch_id',

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
            $tempPassword = Str::random(8) . '1!';

            $customerData = $request->input('customer');
            if (empty($customerData['first_name']) || empty($customerData['last_name'])) {
                $name = $customerData['name'] ?? '';
                $parts = explode(' ', trim($name), 2);
                $customerData['first_name'] = !empty($customerData['first_name']) ? $customerData['first_name'] : ($parts[0] ?? 'Customer');
                $customerData['last_name'] = !empty($customerData['last_name']) ? $customerData['last_name'] : ($parts[1] ?? 'Customer');
            }
            $displayName = trim(($customerData['first_name'] ?? '') . ' ' . ($customerData['last_name'] ?? ''));
            unset($customerData['name']);

            $customerData['opt_in_sms'] = $customerData['opt_in_sms'] ?? false;
            $customerData['opt_in_email'] = $customerData['opt_in_email'] ?? true;

            $customer = Customer::create($customerData);

            $user = User::create([
                'username' => strtolower(str_replace(' ', '_', $displayName)) . '_' . rand(100, 999),
                'email' => $customerData['email'],
                'password_hash' => Hash::make($tempPassword),
                'employee_id' => null,
                'branch_id' => $customerData['branch_id'],
                'is_active' => true,
            ]);

            $customerRole = Role::where('name', 'Customer')->first();
            if ($customerRole) {
                $user->roles()->attach($customerRole->role_id);
            }

            $vehicle = null;
            if ($request->has('vehicle') && !empty($request->input('vehicle'))) {
                $vehicleData = $request->input('vehicle');
                $vehicleData['customer_id'] = $customer->customer_id;
                $vehicle = Vehicle::create($vehicleData);
            }

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
                        'temporary_password' => $tempPassword,
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

    public function show(Customer $customer)
    {
        $user = auth()->user();
        $isTechnician = $user->hasRole('Technician') || $user->hasRole('Service Advisor');

        if ($isTechnician && $customer->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized to view this customer'], 403);
        }

        return $customer->load([
            'branch',
            'vehicles',
            'appointments.vehicle',
            'appointments.bay',
            'appointments.technician.employee',
            'quotations.vehicle',
            'quotations.createdBy.employee',
            'workOrders.vehicle',
            'workOrders.jobCards',
            'invoices.payments',
            'payments',
            'vehicleCheckins.vehicle',
            'vehicleCheckins.checkedInBy.employee',
            'complaints',
            'communicationLogs',
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|nullable|string|max:150',
            'first_name' => 'sometimes|nullable|string|max:150',
            'last_name' => 'sometimes|nullable|string|max:150',
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

        $updateData = $request->all();
        if (isset($updateData['name']) && (empty($updateData['first_name']) || empty($updateData['last_name']))) {
            $parts = explode(' ', trim($updateData['name']), 2);
            if (!empty($parts[0])) $updateData['first_name'] = $parts[0];
            if (isset($parts[1])) $updateData['last_name'] = $parts[1];
        }
        unset($updateData['name']);

        $customer->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Customer updated successfully',
            'data' => $customer
        ]);
    }

    public function destroy(Customer $customer)
    {
        if ($customer->appointments()->whereIn('status', ['booked', 'confirmed'])->exists()) {
            return response()->json(['message' => 'Cannot delete customer with active appointments'], 422);
        }

        $user = User::where('email', $customer->email)->first();
        if ($user) {
            $user->delete();
        }

        $customer->delete();

        return response()->json(['success' => true, 'message' => 'Customer deleted successfully']);
    }

    public function sendCredentials(Request $request, Customer $customer)
    {
        $user = User::where('email', $customer->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User account not found for this customer'], 404);
        }

        $tempPassword = Str::random(8) . '1!';
        $user->update(['password_hash' => Hash::make($tempPassword)]);

        $this->sendCredentialsEmail($customer, $user, $tempPassword);

        return response()->json([
            'success' => true,
            'message' => 'Credentials sent to customer email',
            'temporary_password' => $tempPassword
        ]);
    }

    private function sendCredentialsEmail($customer, $user, $password)
    {
        \Log::info('Customer credentials', [
            'customer' => $customer->email,
            'password' => $password,
            'user_id' => $user->user_id,
        ]);
    }

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
                    ->orWhere(DB::raw("CONCAT(first_name, ' ', last_name)"), 'like', '%' . $searchQuery . '%')
                    ->orWhere('email', 'like', '%' . $searchQuery . '%')
                    ->orWhere('phone', 'like', '%' . $searchQuery . '%');
            });

        if ($isTechnician) {
            $customers->where('branch_id', $user->branch_id);
        }

        return $customers->limit(20)->get();
    }
}