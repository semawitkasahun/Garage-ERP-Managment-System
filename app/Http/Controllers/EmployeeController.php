<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $query = Employee::query()->with(['branch', 'user']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Department filter (via branch_id)
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        // Department filter (by department name via branch relationship)
        if ($request->filled('department')) {
            $query->whereHas('branch', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->input('department') . '%');
            });
        }

        // Job Title filter
        if ($request->filled('job_title')) {
            $query->where('job_title', $request->input('job_title'));
        }

        // Employment Status filter
        if ($request->filled('employment_status')) {
            $query->where('employment_status', $request->input('employment_status'));
        }

        // Hire Date filter
        if ($request->filled('hire_date_from')) {
            $query->where('hire_date', '>=', $request->input('hire_date_from'));
        }
        if ($request->filled('hire_date_to')) {
            $query->where('hire_date', '<=', $request->input('hire_date_to'));
        }

        // Sorting
        $sortField = $request->input('sort_by', 'hire_date');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        $validSortFields = ['first_name', 'last_name', 'job_title', 'employment_status', 'hire_date'];
        if (in_array($sortField, $validSortFields)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->latest();
        }

        return $query->paginate($request->integer('per_page', 20));
    }

    /**
     * Dashboard summary stats for the Employees module.
     */
    public function stats(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasAnyRole(['Admin', 'Owner', 'HR Manager', 'Supervisor', 'Manager']);
        $branchId = $isAdmin ? $request->input('branch_id') : $user->branch_id;

        $base = Employee::query();
        if ($branchId) {
            $base->where('branch_id', $branchId);
        }

        $currentMonth = now()->month;
        $currentYear = now()->year;
        $today = now()->toDateString();

        $totalEmployees = (clone $base)->count();
        $activeEmployees = (clone $base)->where('employment_status', 'active')->count();
        $inactiveEmployees = (clone $base)->where('employment_status', 'inactive')->count();
        $onLeaveToday = (clone $base)
            ->where('employment_status', 'on_leave')
            ->whereHas('leaveRequests', function ($query) use ($today) {
                $query->where('status', 'approved')
                    ->where('start_date', '<=', $today)
                    ->where('end_date', '>=', $today);
            })
            ->count();
        $newHiresThisMonth = (clone $base)
            ->whereMonth('hire_date', $currentMonth)
            ->whereYear('hire_date', $currentYear)
            ->count();

        return response()->json([
            'total_employees' => $totalEmployees,
            'active_employees' => $activeEmployees,
            'inactive_employees' => $inactiveEmployees,
            'on_leave_today' => $onLeaveToday,
            'new_hires_this_month' => $newHiresThisMonth,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'job_title' => 'nullable|string|max:50',
            'hire_date' => 'nullable|date',
            'phone' => 'required|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'employment_status' => 'nullable|string|max:20',
        ]);

        $employee = Employee::create($validated);
        return response()->json($employee, 201);
    }

    public function show(Employee $employee)
    {
        return $employee->load([
            'branch',
            'user',
            'technicianSkills',
            'attendance',
            'leaveRequests',
            'performanceEvaluations'
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'first_name' => 'sometimes|required|string|max:50',
            'last_name' => 'sometimes|required|string|max:50',
            'job_title' => 'nullable|string|max:50',
            'hire_date' => 'nullable|date',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'employment_status' => 'nullable|string|max:20',
        ]);

        $employee->update($validated);
        return $employee;
    }

    public function destroy(Employee $employee)
    {
        $employee->delete();
        return response()->noContent();
    }
}