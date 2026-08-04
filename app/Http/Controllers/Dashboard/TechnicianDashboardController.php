<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\WorkOrder;
use App\Models\JobCard;
use App\Models\JobCardTask;
use App\Models\Inspection;
use App\Models\LaborLog;
use Carbon\Carbon;

class TechnicianDashboardController extends Controller
{
    /**
     * Technician Dashboard - Assigned tasks and jobs
     * Accessible only by users with Technician role
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $employee = $user->employee;

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Employee record not found',
            ], 404);
        }

        $today = Carbon::today();

        $stats = [
            // Task Summary
            'task_summary' => [
                'assigned' => JobCardTask::where('technician_id', $user->user_id)
                    ->where('status', 'pending')
                    ->count(),
                'in_progress' => JobCardTask::where('technician_id', $user->user_id)
                    ->where('status', 'in_progress')
                    ->count(),
                'completed' => JobCardTask::where('technician_id', $user->user_id)
                    ->where('status', 'done')
                    ->count(),
                'total' => JobCardTask::where('technician_id', $user->user_id)->count(),
            ],

            // Today's Work
            'today' => [
                'clocked_in' => LaborLog::where('technician_id', $user->user_id)
                    ->whereDate('clock_in', $today)
                    ->whereNull('clock_out')
                    ->exists(),
                'hours_logged' => LaborLog::where('technician_id', $user->user_id)
                    ->whereDate('clock_in', $today)
                    ->sum('hours_logged'),
                'earnings' => LaborLog::where('technician_id', $user->user_id)
                    ->whereDate('clock_in', $today)
                    ->sum('labor_cost'),
                'tasks' => JobCardTask::where('technician_id', $user->user_id)
                    ->whereDate('created_at', $today)
                    ->with(['jobCard.workOrder', 'jobCard.workOrder.customer', 'jobCard.workOrder.vehicle'])
                    ->get(),
            ],

            // Inspections
            'inspections' => [
                'pending' => Inspection::where('technician_id', $user->user_id)
                    ->where('status', 'pending')
                    ->count(),
                'in_progress' => Inspection::where('technician_id', $user->user_id)
                    ->where('status', 'in_progress')
                    ->count(),
                'completed' => Inspection::where('technician_id', $user->user_id)
                    ->where('status', 'completed')
                    ->count(),
                'total' => Inspection::where('technician_id', $user->user_id)->count(),
            ],

            // Work Orders
            'work_orders' => [
                'assigned' => WorkOrder::whereHas('jobCards.tasks', function($q) use ($user) {
                    $q->where('technician_id', $user->user_id)
                        ->whereIn('status', ['pending', 'in_progress']);
                })->count(),
                'completed' => WorkOrder::whereHas('jobCards.tasks', function($q) use ($user) {
                    $q->where('technician_id', $user->user_id)
                        ->where('status', 'done');
                })->count(),
                'recent' => WorkOrder::whereHas('jobCards.tasks', function($q) use ($user) {
                    $q->where('technician_id', $user->user_id);
                })
                ->with(['customer', 'vehicle'])
                ->latest()
                ->limit(5)
                ->get(),
            ],

            // Weekly Stats
            'weekly' => [
                'total_hours' => LaborLog::where('technician_id', $user->user_id)
                    ->whereDate('clock_in', '>=', Carbon::now()->startOfWeek())
                    ->sum('hours_logged'),
                'total_earnings' => LaborLog::where('technician_id', $user->user_id)
                    ->whereDate('clock_in', '>=', Carbon::now()->startOfWeek())
                    ->sum('labor_cost'),
                'tasks_completed' => JobCardTask::where('technician_id', $user->user_id)
                    ->where('status', 'done')
                    ->whereDate('updated_at', '>=', Carbon::now()->startOfWeek())
                    ->count(),
            ],

            // Recent Activity
            'recent_activity' => [
                'recent_tasks' => JobCardTask::where('technician_id', $user->user_id)
                    ->with(['jobCard.workOrder', 'jobCard.workOrder.customer', 'jobCard.workOrder.vehicle'])
                    ->latest()
                    ->limit(5)
                    ->get(),
                'recent_labor_logs' => LaborLog::where('technician_id', $user->user_id)
                    ->with(['task'])
                    ->latest()
                    ->limit(5)
                    ->get(),
            ],

            // Availability Status
            'status' => $this->getTechnicianStatus($user->user_id),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'user' => $user->load(['employee', 'branch']),
            'role' => 'Technician',
        ]);
    }

    /**
     * Get today's schedule
     */
    public function todaySchedule(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();

        $tasks = JobCardTask::where('technician_id', $user->user_id)
            ->whereDate('created_at', $today)
            ->orWhereDate('start_time', $today)
            ->orWhereDate('end_time', $today)
            ->with(['jobCard.workOrder', 'jobCard.workOrder.customer', 'jobCard.workOrder.vehicle'])
            ->orderBy('created_at', 'asc')
            ->get();

        $laborLog = LaborLog::where('technician_id', $user->user_id)
            ->whereDate('clock_in', $today)
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'date' => $today->format('Y-m-d'),
                'tasks' => $tasks,
                'total_tasks' => $tasks->count(),
                'clocked_in' => $laborLog ? true : false,
                'clock_in_time' => $laborLog?->clock_in,
                'clock_out_time' => $laborLog?->clock_out,
                'hours_logged' => $laborLog?->hours_logged ?? 0,
            ],
        ]);
    }

    /**
     * Get labor summary
     */
    public function laborSummary(Request $request)
    {
        $user = $request->user();
        $period = $request->period ?? 'week';

        $startDate = match($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfWeek(),
        };

        $logs = LaborLog::where('technician_id', $user->user_id)
            ->where('clock_in', '>=', $startDate)
            ->get();

        $summary = [
            'period' => $period,
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => Carbon::now()->format('Y-m-d'),
            'total_hours' => $logs->sum('hours_logged'),
            'total_earnings' => $logs->sum('labor_cost'),
            'total_days' => $logs->groupBy(function($log) {
                return $log->clock_in->format('Y-m-d');
            })->count(),
            'average_hours_per_day' => $logs->groupBy(function($log) {
                return $log->clock_in->format('Y-m-d');
            })->map(function($day) {
                return $day->sum('hours_logged');
            })->avg(),
            'by_day' => $logs->groupBy(function($log) {
                return $log->clock_in->format('Y-m-d');
            })->map(function($day) {
                return [
                    'date' => $day->first()->clock_in->format('Y-m-d'),
                    'hours' => $day->sum('hours_logged'),
                    'earnings' => $day->sum('labor_cost'),
                    'tasks' => $day->count(),
                ];
            })->values(),
        ];

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get technician status
     */
    private function getTechnicianStatus($userId)
    {
        $today = Carbon::today();
        $isClockedIn = LaborLog::where('technician_id', $userId)
            ->whereDate('clock_in', $today)
            ->whereNull('clock_out')
            ->exists();

        $hasTasks = JobCardTask::where('technician_id', $userId)
            ->whereIn('status', ['pending', 'in_progress'])
            ->exists();

        if ($isClockedIn && $hasTasks) {
            return 'busy';
        } elseif ($isClockedIn && !$hasTasks) {
            return 'available';
        } else {
            return 'off_duty';
        }
    }
}