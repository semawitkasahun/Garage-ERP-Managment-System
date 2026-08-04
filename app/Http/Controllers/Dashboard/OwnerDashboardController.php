<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Customer;
use App\Models\Vehicle;
use App\Models\Appointment;
use App\Models\WorkOrder;
use App\Models\Invoice;
use App\Models\Employee;
use App\Models\InventoryItem;
use App\Models\Branch;
use Carbon\Carbon;

class OwnerDashboardController extends Controller
{
    /**
     * Owner Dashboard - Full business overview
     * Accessible only by users with Owner role
     */
    public function index(Request $request)
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $thisWeek = Carbon::now()->startOfWeek();

        $stats = [
            // Business Overview
            'business_summary' => [
                'total_branches' => Branch::count(),
                'total_employees' => Employee::count(),
                'total_customers' => Customer::count(),
                'total_vehicles' => Vehicle::count(),
            ],

            // Revenue Stats
            'revenue' => [
                'total_revenue' => Invoice::where('status', 'paid')->sum('total_amount'),
                'revenue_this_month' => Invoice::where('status', 'paid')
                    ->whereMonth('created_at', $thisMonth->month)
                    ->sum('total_amount'),
                'revenue_this_week' => Invoice::where('status', 'paid')
                    ->whereDate('created_at', '>=', $thisWeek)
                    ->sum('total_amount'),
                'revenue_today' => Invoice::where('status', 'paid')
                    ->whereDate('created_at', $today)
                    ->sum('total_amount'),
                'pending_invoices' => Invoice::where('status', 'unpaid')->sum('total_amount'),
            ],

            // Appointment Stats
            'appointments' => [
                'total' => Appointment::count(),
                'today' => Appointment::whereDate('scheduled_start', $today)->count(),
                'this_week' => Appointment::whereDate('scheduled_start', '>=', $thisWeek)->count(),
                'this_month' => Appointment::whereMonth('scheduled_start', $thisMonth->month)->count(),
                'by_status' => Appointment::select('status', \DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get(),
            ],

            // Work Order Stats
            'work_orders' => [
                'total' => WorkOrder::count(),
                'in_progress' => WorkOrder::where('status', 'in_progress')->count(),
                'completed_today' => WorkOrder::whereDate('completed_at', $today)->count(),
                'by_status' => WorkOrder::select('status', \DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get(),
            ],

            // Inventory Stats
            'inventory' => [
                'total_items' => InventoryItem::count(),
                'low_stock_items' => InventoryItem::whereHas('stock', function($q) {
                    $q->whereColumn('quantity_on_hand', '<=', 'reorder_point');
                })->count(),
                'total_value' => InventoryItem::sum('cost_price'),
            ],

            // Employee Stats
            'employees' => [
                'total' => Employee::count(),
                'active' => Employee::where('employment_status', 'active')->count(),
                'on_leave' => Employee::where('employment_status', 'on_leave')->count(),
                'by_department' => Employee::select('job_title', \DB::raw('count(*) as count'))
                    ->groupBy('job_title')
                    ->get(),
            ],

            // Recent Activity
            'recent_activity' => [
                'recent_appointments' => Appointment::with(['customer', 'vehicle'])
                    ->latest()
                    ->limit(5)
                    ->get(),
                'recent_work_orders' => WorkOrder::with(['customer', 'vehicle'])
                    ->latest()
                    ->limit(5)
                    ->get(),
                'recent_invoices' => Invoice::with(['customer'])
                    ->latest()
                    ->limit(5)
                    ->get(),
                'recent_customers' => Customer::latest()
                    ->limit(5)
                    ->get(),
            ],

            // Performance Metrics
            'performance_metrics' => [
                'appointment_completion_rate' => $this->getAppointmentCompletionRate(),
                'average_work_order_value' => Invoice::where('status', 'paid')->avg('total_amount'),
                'customer_retention_rate' => $this->getRetentionRate(),
                'average_repair_time' => $this->getAverageRepairTime(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'user' => $request->user()->load(['employee', 'branch']),
            'role' => 'Owner',
        ]);
    }

    /**
     * Get revenue chart data
     */
    public function revenueChart(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;
        $months = range(1, 12);
        
        $data = [];
        foreach ($months as $month) {
            $data[] = [
                'month' => Carbon::create()->month($month)->format('M'),
                'revenue' => Invoice::where('status', 'paid')
                    ->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->sum('total_amount'),
                'count' => Invoice::where('status', 'paid')
                    ->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data,
            'year' => $year,
        ]);
    }

    /**
     * Get business KPIs
     */
    public function kpis(Request $request)
    {
        $period = $request->period ?? 'month';
        $startDate = match($period) {
            'week' => Carbon::now()->subWeek(),
            'month' => Carbon::now()->subMonth(),
            'year' => Carbon::now()->subYear(),
            default => Carbon::now()->subMonth(),
        };

        $kpis = [
            'period' => $period,
            'new_customers' => Customer::where('created_at', '>=', $startDate)->count(),
            'new_appointments' => Appointment::where('created_at', '>=', $startDate)->count(),
            'completed_work_orders' => WorkOrder::where('completed_at', '>=', $startDate)->count(),
            'revenue' => Invoice::where('status', 'paid')
                ->where('created_at', '>=', $startDate)
                ->sum('total_amount'),
            'average_rating' => \DB::table('vehicle_deliveries')
                ->where('created_at', '>=', $startDate)
                ->avg('feedback_rating'),
        ];

        return response()->json([
            'success' => true,
            'data' => $kpis,
        ]);
    }

    private function getAppointmentCompletionRate()
    {
        $total = Appointment::count();
        $completed = Appointment::where('status', 'completed')->count();
        return $total > 0 ? round(($completed / $total) * 100, 2) : 0;
    }

    private function getRetentionRate()
    {
        $total = Customer::count();
        $returning = Customer::whereHas('appointments', function($q) {
            $q->where('status', 'completed');
        })->count();
        return $total > 0 ? round(($returning / $total) * 100, 2) : 0;
    }

    private function getAverageRepairTime()
    {
        $completed = WorkOrder::whereNotNull('completed_at')
            ->whereNotNull('created_at')
            ->get();

        if ($completed->isEmpty()) {
            return 0;
        }

        $totalHours = 0;
        foreach ($completed as $workOrder) {
            $totalHours += $workOrder->created_at->diffInHours($workOrder->completed_at);
        }

        return round($totalHours / $completed->count(), 2);
    }
}