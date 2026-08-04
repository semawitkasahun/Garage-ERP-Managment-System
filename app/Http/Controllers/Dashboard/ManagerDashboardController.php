<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WorkOrder;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\InventoryItem;
use App\Models\JobCard;
use Carbon\Carbon;

class ManagerDashboardController extends Controller
{
    /**
     * Manager Dashboard - Department overview
     * Accessible only by users with Manager role
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $today = Carbon::today();
        $thisWeek = Carbon::now()->startOfWeek();
        $thisMonth = Carbon::now()->startOfMonth();

        $stats = [
            // Department Overview
            'department_summary' => [
                'employees' => Employee::where('branch_id', $branchId)->count(),
                'customers' => Customer::where('branch_id', $branchId)->count(),
                'active_employees' => Employee::where('branch_id', $branchId)
                    ->where('employment_status', 'active')
                    ->count(),
            ],

            // Work Orders
            'work_orders' => [
                'total' => WorkOrder::where('branch_id', $branchId)->count(),
                'today' => WorkOrder::where('branch_id', $branchId)
                    ->whereDate('created_at', $today)
                    ->count(),
                'this_week' => WorkOrder::where('branch_id', $branchId)
                    ->whereDate('created_at', '>=', $thisWeek)
                    ->count(),
                'this_month' => WorkOrder::where('branch_id', $branchId)
                    ->whereMonth('created_at', $thisMonth->month)
                    ->count(),
                'in_progress' => WorkOrder::where('branch_id', $branchId)
                    ->where('status', 'in_progress')
                    ->count(),
                'completed' => WorkOrder::where('branch_id', $branchId)
                    ->where('status', 'completed')
                    ->count(),
                'on_hold' => WorkOrder::where('branch_id', $branchId)
                    ->where('status', 'on_hold')
                    ->count(),
                'by_status' => WorkOrder::where('branch_id', $branchId)
                    ->select('status', \DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get(),
            ],

            // Appointments
            'appointments' => [
                'total' => Appointment::where('branch_id', $branchId)->count(),
                'today' => Appointment::where('branch_id', $branchId)
                    ->whereDate('scheduled_start', $today)
                    ->count(),
                'this_week' => Appointment::where('branch_id', $branchId)
                    ->whereDate('scheduled_start', '>=', $thisWeek)
                    ->count(),
                'upcoming' => Appointment::where('branch_id', $branchId)
                    ->where('scheduled_start', '>=', Carbon::now())
                    ->whereNotIn('status', ['cancelled', 'completed'])
                    ->with(['customer', 'vehicle'])
                    ->orderBy('scheduled_start', 'asc')
                    ->limit(10)
                    ->get(),
                'by_status' => Appointment::where('branch_id', $branchId)
                    ->select('status', \DB::raw('count(*) as count'))
                    ->groupBy('status')
                    ->get(),
            ],

            // Revenue
            'revenue' => [
                'total' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
                    ->sum('total_amount'),
                'this_month' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
                    ->whereMonth('created_at', $thisMonth->month)
                    ->sum('total_amount'),
                'this_week' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
                    ->whereDate('created_at', '>=', $thisWeek)
                    ->sum('total_amount'),
                'today' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
                    ->whereDate('created_at', $today)
                    ->sum('total_amount'),
                'pending' => Invoice::where('branch_id', $branchId)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->sum('total_amount'),
            ],

            // Inventory
            'inventory' => [
                'total_items' => InventoryItem::whereHas('stock', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })->count(),
                'low_stock_items' => InventoryItem::whereHas('stock', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                        ->whereColumn('quantity_on_hand', '<=', 'reorder_point');
                })->count(),
                'out_of_stock' => InventoryItem::whereHas('stock', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                        ->where('quantity_on_hand', '<=', 0);
                })->count(),
                'total_value' => InventoryItem::whereHas('stock', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })->sum('cost_price'),
            ],

            // Customer Activity
            'customers' => [
                'new_this_month' => Customer::where('branch_id', $branchId)
                    ->whereMonth('created_at', $thisMonth->month)
                    ->count(),
                'new_this_week' => Customer::where('branch_id', $branchId)
                    ->whereDate('created_at', '>=', $thisWeek)
                    ->count(),
                'active' => Customer::where('branch_id', $branchId)
                    ->whereHas('appointments', function($q) use ($branchId) {
                        $q->where('branch_id', $branchId)
                            ->where('scheduled_start', '>=', Carbon::now()->subDays(30));
                    })
                    ->count(),
                'recent' => Customer::where('branch_id', $branchId)
                    ->with(['vehicles'])
                    ->latest()
                    ->limit(10)
                    ->get(),
            ],

            // Performance Metrics
            'performance' => [
                'average_repair_time' => $this->getAverageRepairTime($branchId),
                'appointment_completion_rate' => $this->getAppointmentCompletionRate($branchId),
                'average_work_order_value' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
                    ->avg('total_amount'),
                'employee_productivity' => $this->getEmployeeProductivity($branchId),
            ],

            // Recent Activity
            'recent_activity' => [
                'recent_work_orders' => WorkOrder::where('branch_id', $branchId)
                    ->with(['customer', 'vehicle'])
                    ->latest()
                    ->limit(10)
                    ->get(),
                'recent_appointments' => Appointment::where('branch_id', $branchId)
                    ->with(['customer', 'vehicle'])
                    ->latest()
                    ->limit(10)
                    ->get(),
                'recent_customers' => Customer::where('branch_id', $branchId)
                    ->latest()
                    ->limit(10)
                    ->get(),
                'recent_invoices' => Invoice::where('branch_id', $branchId)
                    ->with(['customer'])
                    ->latest()
                    ->limit(10)
                    ->get(),
            ],

            // Job Cards
            'job_cards' => [
                'open' => JobCard::whereHas('workOrder', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })->where('status', 'open')->count(),
                'in_progress' => JobCard::whereHas('workOrder', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })->where('status', 'in_progress')->count(),
                'completed' => JobCard::whereHas('workOrder', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })->where('status', 'completed')->count(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'user' => $user->load(['employee', 'branch']),
            'role' => 'Manager',
        ]);
    }

    /**
     * Get branch performance metrics
     */
    public function performanceMetrics(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $period = $request->period ?? 'month';

        $startDate = match($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        $metrics = [
            'period' => $period,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => Carbon::now()->format('Y-m-d'),
            'revenue' => Invoice::where('branch_id', $branchId)
                ->where('status', 'paid')
                ->where('created_at', '>=', $startDate)
                ->sum('total_amount'),
            'work_orders_completed' => WorkOrder::where('branch_id', $branchId)
                ->where('status', 'completed')
                ->where('completed_at', '>=', $startDate)
                ->count(),
            'appointments_completed' => Appointment::where('branch_id', $branchId)
                ->where('status', 'completed')
                ->where('scheduled_start', '>=', $startDate)
                ->count(),
            'new_customers' => Customer::where('branch_id', $branchId)
                ->where('created_at', '>=', $startDate)
                ->count(),
            'average_rating' => \DB::table('vehicle_deliveries')
                ->whereHas('workOrder', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })
                ->where('created_at', '>=', $startDate)
                ->avg('feedback_rating'),
        ];

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }

    /**
     * Get employee performance for branch
     */
    public function employeePerformance(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $employees = Employee::where('branch_id', $branchId)
            ->withCount(['workOrders' => function($q) {
                $q->where('status', 'completed');
            }])
            ->withCount(['appointments' => function($q) {
                $q->where('status', 'completed');
            }])
            ->with(['user'])
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->employee_id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'job_title' => $employee->job_title,
                    'completed_work_orders' => $employee->work_orders_count,
                    'completed_appointments' => $employee->appointments_count,
                    'has_user' => $employee->user ? true : false,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * Get revenue chart data for branch
     */
    public function revenueChart(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;
        $year = $request->year ?? Carbon::now()->year;

        $months = range(1, 12);
        $data = [];

        foreach ($months as $month) {
            $data[] = [
                'month' => Carbon::create()->month($month)->format('M'),
                'revenue' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
                    ->whereYear('created_at', $year)
                    ->whereMonth('created_at', $month)
                    ->sum('total_amount'),
                'count' => Invoice::where('branch_id', $branchId)
                    ->where('status', 'paid')
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
     * Get technician workload
     */
    public function technicianWorkload(Request $request)
    {
        $user = $request->user();
        $branchId = $user->branch_id;

        $technicians = Employee::where('branch_id', $branchId)
            ->where('job_title', 'Technician')
            ->with(['user'])
            ->get()
            ->map(function($technician) {
                $assignedTasks = \App\Models\JobCardTask::where('technician_id', $technician->user?->user_id)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->count();

                $completedTasks = \App\Models\JobCardTask::where('technician_id', $technician->user?->user_id)
                    ->where('status', 'done')
                    ->count();

                return [
                    'id' => $technician->employee_id,
                    'name' => $technician->first_name . ' ' . $technician->last_name,
                    'assigned_tasks' => $assignedTasks,
                    'completed_tasks' => $completedTasks,
                    'total_tasks' => $assignedTasks + $completedTasks,
                    'has_user' => $technician->user ? true : false,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $technicians,
        ]);
    }

    private function getAverageRepairTime($branchId)
    {
        $completed = WorkOrder::where('branch_id', $branchId)
            ->whereNotNull('completed_at')
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

    private function getAppointmentCompletionRate($branchId)
    {
        $total = Appointment::where('branch_id', $branchId)->count();
        $completed = Appointment::where('branch_id', $branchId)
            ->where('status', 'completed')
            ->count();

        return $total > 0 ? round(($completed / $total) * 100, 2) : 0;
    }

    private function getEmployeeProductivity($branchId)
    {
        $employees = Employee::where('branch_id', $branchId)->count();
        $completedWorkOrders = WorkOrder::where('branch_id', $branchId)
            ->where('status', 'completed')
            ->count();

        return $employees > 0 ? round($completedWorkOrders / $employees, 2) : 0;
    }
}