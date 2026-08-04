<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\PayrollRun;
use App\Models\PerformanceEvaluation;
use Carbon\Carbon;

class HRDashboardController extends Controller
{
    /**
     * HR Dashboard - Employee management overview
     * Accessible only by users with Supervisor role (HR Manager)
     */
    public function index(Request $request)
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();

        $stats = [
            // Employee Stats
            'employee_summary' => [
                'total' => Employee::count(),
                'active' => Employee::where('employment_status', 'active')->count(),
                'on_leave' => Employee::where('employment_status', 'on_leave')->count(),
                'inactive' => Employee::where('employment_status', 'inactive')->count(),
                'new_this_month' => Employee::whereMonth('hire_date', $thisMonth->month)->count(),
            ],

            // Attendance
            'attendance' => [
                'clocked_in_today' => Attendance::whereDate('attendance_date', $today)
                    ->whereNotNull('clock_in')
                    ->whereNull('clock_out')
                    ->count(),
                'present_today' => Attendance::whereDate('attendance_date', $today)
                    ->where('status', 'present')
                    ->count(),
                'absent_today' => Attendance::whereDate('attendance_date', $today)
                    ->where('status', 'absent')
                    ->count(),
                'late_today' => Attendance::whereDate('attendance_date', $today)
                    ->where('status', 'late')
                    ->count(),
                'attendance_rate' => $this->getAttendanceRate(),
            ],

            // Leave Requests
            'leave_requests' => [
                'pending' => LeaveRequest::where('status', 'pending')->count(),
                'approved' => LeaveRequest::where('status', 'approved')->count(),
                'rejected' => LeaveRequest::where('status', 'rejected')->count(),
                'this_month' => LeaveRequest::whereMonth('start_date', $thisMonth->month)
                    ->where('status', 'approved')
                    ->count(),
            ],

            // Payroll
            'payroll' => [
                'total_payroll_this_month' => PayrollRun::whereMonth('created_at', $thisMonth->month)
                    ->where('status', 'processed')
                    ->with(['items'])
                    ->get()
                    ->sum(function($run) {
                        return $run->items->sum('net_pay');
                    }),
                'pending_payroll' => PayrollRun::where('status', 'pending')->count(),
                'processed_payroll' => PayrollRun::where('status', 'processed')->count(),
                'total_employees_paid' => PayrollRun::whereMonth('created_at', $thisMonth->month)
                    ->where('status', 'processed')
                    ->sum(function($run) {
                        return $run->items->count();
                    }),
            ],

            // Performance
            'performance' => [
                'average_rating' => PerformanceEvaluation::avg('rating'),
                'total_evaluations' => PerformanceEvaluation::count(),
                'recent_evaluations' => PerformanceEvaluation::with(['employee', 'evaluator'])
                    ->latest()
                    ->limit(5)
                    ->get(),
            ],

            // Department Stats
            'departments' => Employee::select('job_title', \DB::raw('count(*) as count'))
                ->groupBy('job_title')
                ->get()
                ->map(function($item) {
                    return [
                        'department' => $item->job_title ?: 'Unassigned',
                        'count' => $item->count,
                    ];
                }),

            // Recent Hires
            'recent_hires' => Employee::with(['branch'])
                ->orderBy('hire_date', 'desc')
                ->limit(5)
                ->get(),

            // Upcoming
            'upcoming' => [
                'birthdays' => $this->getUpcomingBirthdays(),
                'work_anniversaries' => $this->getWorkAnniversaries(),
                'leaves' => LeaveRequest::where('status', 'approved')
                    ->where('start_date', '<=', Carbon::now()->addDays(7))
                    ->where('end_date', '>=', Carbon::now())
                    ->with(['employee'])
                    ->get(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'user' => $request->user()->load(['employee', 'branch']),
            'role' => 'HR Manager',
        ]);
    }

    /**
     * Get attendance overview for date range
     */
    public function attendanceOverview(Request $request)
    {
        $startDate = $request->start_date ?? Carbon::now()->subDays(30);
        $endDate = $request->end_date ?? Carbon::now();

        $attendance = Attendance::whereBetween('attendance_date', [$startDate, $endDate])
            ->with(['employee'])
            ->get();

        $summary = [
            'total_days' => $attendance->count(),
            'present' => $attendance->where('status', 'present')->count(),
            'absent' => $attendance->where('status', 'absent')->count(),
            'late' => $attendance->where('status', 'late')->count(),
            'by_date' => $attendance->groupBy('attendance_date')->map(function($group) {
                return [
                    'present' => $group->where('status', 'present')->count(),
                    'absent' => $group->where('status', 'absent')->count(),
                    'late' => $group->where('status', 'late')->count(),
                ];
            }),
            'by_employee' => $attendance->groupBy('employee_id')->map(function($group) {
                $employee = $group->first()->employee;
                return [
                    'employee' => $employee->first_name . ' ' . $employee->last_name,
                    'present' => $group->where('status', 'present')->count(),
                    'absent' => $group->where('status', 'absent')->count(),
                    'late' => $group->where('status', 'late')->count(),
                ];
            })->values(),
        ];

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Get employee performance summary
     */
    public function employeePerformance(Request $request)
    {
        $employees = Employee::withCount(['attendance' => function($q) {
                $q->where('status', 'present');
            }])
            ->withCount(['leaveRequests' => function($q) {
                $q->where('status', 'approved');
            }])
            ->with(['performanceEvaluations'])
            ->get()
            ->map(function($employee) {
                return [
                    'id' => $employee->employee_id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'job_title' => $employee->job_title,
                    'attendance_count' => $employee->attendance_count,
                    'leave_count' => $employee->leave_requests_count,
                    'avg_rating' => $employee->performanceEvaluations->avg('rating'),
                    'evaluations_count' => $employee->performanceEvaluations->count(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $employees,
        ]);
    }

    /**
     * Get payroll stats
     */
    public function payrollStats(Request $request)
    {
        $year = $request->year ?? Carbon::now()->year;

        $stats = [
            'year' => $year,
            'total_payroll_runs' => PayrollRun::whereYear('created_at', $year)->count(),
            'processed' => PayrollRun::whereYear('created_at', $year)
                ->where('status', 'processed')
                ->count(),
            'pending' => PayrollRun::whereYear('created_at', $year)
                ->where('status', 'pending')
                ->count(),
            'total_net_pay' => PayrollRun::whereYear('created_at', $year)
                ->where('status', 'processed')
                ->with(['items'])
                ->get()
                ->sum(function($run) {
                    return $run->items->sum('net_pay');
                }),
            'monthly_breakdown' => $this->getMonthlyPayrollBreakdown($year),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    private function getAttendanceRate()
    {
        $totalDays = Attendance::count();
        $presentDays = Attendance::where('status', 'present')->count();
        return $totalDays > 0 ? round(($presentDays / $totalDays) * 100, 2) : 0;
    }

    private function getUpcomingBirthdays()
    {
        $today = Carbon::today();
        $employees = Employee::all();
        
        return $employees->filter(function($employee) use ($today) {
            if (!$employee->hire_date) return false;
            $birthday = Carbon::parse($employee->hire_date);
            $birthday->year = $today->year;
            
            $diff = $today->diffInDays($birthday);
            return $diff >= 0 && $diff <= 30;
        })->map(function($employee) {
            $birthday = Carbon::parse($employee->hire_date);
            $birthday->year = Carbon::now()->year;
            return [
                'employee' => $employee->first_name . ' ' . $employee->last_name,
                'date' => $birthday->format('Y-m-d'),
                'days_until' => Carbon::now()->diffInDays($birthday),
            ];
        })->values();
    }

    private function getWorkAnniversaries()
    {
        $today = Carbon::today();
        $employees = Employee::all();
        
        return $employees->filter(function($employee) use ($today) {
            if (!$employee->hire_date) return false;
            $anniversary = Carbon::parse($employee->hire_date);
            $anniversary->year = $today->year;
            
            $diff = $today->diffInDays($anniversary);
            return $diff >= 0 && $diff <= 30;
        })->map(function($employee) {
            $anniversary = Carbon::parse($employee->hire_date);
            $anniversary->year = Carbon::now()->year;
            $years = Carbon::now()->year - Carbon::parse($employee->hire_date)->year;
            return [
                'employee' => $employee->first_name . ' ' . $employee->last_name,
                'date' => $anniversary->format('Y-m-d'),
                'years' => $years,
            ];
        })->values();
    }

    private function getMonthlyPayrollBreakdown($year)
    {
        $months = range(1, 12);
        $breakdown = [];
        
        foreach ($months as $month) {
            $payrolls = PayrollRun::whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->where('status', 'processed')
                ->with(['items'])
                ->get();
            
            $breakdown[] = [
                'month' => Carbon::create()->month($month)->format('M'),
                'total' => $payrolls->sum(function($run) {
                    return $run->items->sum('net_pay');
                }),
                'employees' => $payrolls->sum(function($run) {
                    return $run->items->count();
                }),
            ];
        }
        
        return $breakdown;
    }
}