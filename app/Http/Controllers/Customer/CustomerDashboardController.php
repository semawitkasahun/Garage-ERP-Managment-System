<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Appointment;
use App\Models\Quotation;
use App\Models\Invoice;
use Carbon\Carbon;

class CustomerDashboardController extends Controller
{
    /**
     * Customer Dashboard - Shows all customer data
     * Accessible only by users with Customer role
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Find customer by email
        $customer = Customer::where('email', $user->email)->first();
        
        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer record not found. Please contact support.',
            ], 404);
        }

        $stats = [
            // Summary
            'customer' => $customer,
            
            // Vehicles
            'total_vehicles' => Vehicle::where('customer_id', $customer->customer_id)->count(),
            'vehicles' => Vehicle::where('customer_id', $customer->customer_id)
                ->get(['vehicle_id', 'make', 'model', 'year', 'plate_number', 'mileage']),
            
            // Appointments
            'total_appointments' => Appointment::where('customer_id', $customer->customer_id)->count(),
            'upcoming_appointments' => Appointment::where('customer_id', $customer->customer_id)
                ->where('scheduled_start', '>=', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->with(['vehicle', 'branch'])
                ->orderBy('scheduled_start', 'asc')
                ->get(),
            
            'past_appointments' => Appointment::where('customer_id', $customer->customer_id)
                ->where('scheduled_start', '<', Carbon::now())
                ->where('status', '!=', 'cancelled')
                ->with(['vehicle', 'branch'])
                ->orderBy('scheduled_start', 'desc')
                ->limit(10)
                ->get(),
            
            // Quotations
            'quotations' => Quotation::where('customer_id', $customer->customer_id)
                ->where('status', 'approved')
                ->with(['vehicle', 'items'])
                ->latest()
                ->limit(5)
                ->get(),
            
            'pending_quotations' => Quotation::where('customer_id', $customer->customer_id)
                ->whereIn('status', ['draft', 'sent'])
                ->with(['vehicle'])
                ->get(),
            
            // Invoices
            'total_invoices' => Invoice::where('customer_id', $customer->customer_id)->count(),
            'unpaid_invoices' => Invoice::where('customer_id', $customer->customer_id)
                ->where('status', 'unpaid')
                ->orWhere('status', 'partial')
                ->with(['branch'])
                ->get(),
            
            'paid_invoices' => Invoice::where('customer_id', $customer->customer_id)
                ->where('status', 'paid')
                ->with(['branch'])
                ->latest()
                ->limit(5)
                ->get(),
            
            // Service History
            'service_history' => Appointment::where('customer_id', $customer->customer_id)
                ->where('status', 'completed')
                ->with(['vehicle', 'workOrder'])
                ->orderBy('scheduled_start', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'user' => $user,
            'role' => 'Customer',
        ]);
    }

    /**
     * Get quick stats for customer portal
     */
    public function quickStats(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $stats = [
            'vehicles' => Vehicle::where('customer_id', $customer->customer_id)->count(),
            'upcoming_appointments' => Appointment::where('customer_id', $customer->customer_id)
                ->where('scheduled_start', '>=', Carbon::now())
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->count(),
            'unpaid_invoices' => Invoice::where('customer_id', $customer->customer_id)
                ->whereIn('status', ['unpaid', 'partial'])
                ->count(),
            'pending_quotations' => Quotation::where('customer_id', $customer->customer_id)
                ->whereIn('status', ['draft', 'sent'])
                ->count(),
            'total_spent' => Invoice::where('customer_id', $customer->customer_id)
                ->where('status', 'paid')
                ->sum('total_amount'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }
}