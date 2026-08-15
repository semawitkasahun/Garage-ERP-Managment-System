<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use Illuminate\Http\Request;

class LeaveRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = LeaveRequest::query()->with(['employee', 'approvedBy']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('leave_type')) {
            $query->where('leave_type', $request->leave_type);
        }

        if ($request->has('from_date')) {
            $query->whereDate('start_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('end_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'leave_type' => 'required|string|max:30',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'attachment' => 'nullable|string',
        ]);

        // Calculate days
        $start = \Carbon\Carbon::parse($validated['start_date']);
        $end = \Carbon\Carbon::parse($validated['end_date']);
        $validated['days'] = $start->diffInDays($end) + 1;
        $validated['status'] = 'pending';

        $leave = LeaveRequest::create($validated);
        return response()->json($leave->load('employee'), 201);
    }

    public function show(LeaveRequest $leaveRequest)
    {
        return $leaveRequest->load(['employee', 'approvedBy']);
    }

    public function update(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
        ]);

        $leaveRequest->update($validated);
        return $leaveRequest;
    }

    public function destroy(LeaveRequest $leaveRequest)
    {
        if ($leaveRequest->status === 'approved') {
            return response()->json([
                'message' => 'Cannot delete approved leave request'
            ], 422);
        }

        $leaveRequest->delete();
        return response()->noContent();
    }

    public function approve(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'approved_by' => 'required|integer|exists:users,user_id',
        ]);

        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => $validated['approved_by'],
            'approved_at' => now(),
        ]);
        return $leaveRequest;
    }

    public function reject(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $leaveRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);
        return $leaveRequest;
    }

    public function getByEmployee($employeeId)
    {
        $leaves = LeaveRequest::where('employee_id', $employeeId)
            ->with(['approvedBy'])
            ->latest()
            ->get();
        return $leaves;
    }

    public function getPending()
    {
        $leaves = LeaveRequest::where('status', 'pending')
            ->with(['employee'])
            ->latest()
            ->get();
        return $leaves;
    }

    public function getApproved()
    {
        $leaves = LeaveRequest::where('status', 'approved')
            ->with(['employee'])
            ->latest()
            ->get();
        return $leaves;
    }

    /**
     * Get leave dashboard statistics
     */
    public function getStats(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasAnyRole(['Admin', 'Owner', 'HR Manager', 'Supervisor', 'Manager']);
        $branchId = $isAdmin ? $request->input('branch_id') : $user->branch_id;

        $today = now()->toDateString();
        $thisMonth = now()->startOfMonth();
        $nextMonth = now()->addMonth()->startOfMonth();

        $base = LeaveRequest::query()->with('employee');
        if ($branchId) {
            $base->whereHas('employee', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            });
        }

        $totalEmployees = \App\Models\Employee::query()
            ->when($branchId, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->where('employment_status', 'active')
            ->count();

        $onLeaveToday = (clone $base)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();

        $pendingRequests = (clone $base)
            ->where('status', 'pending')
            ->count();

        $approvedThisMonth = (clone $base)
            ->where('status', 'approved')
            ->whereBetween('approved_at', [$thisMonth, $nextMonth])
            ->count();

        $rejectedThisMonth = (clone $base)
            ->where('status', 'rejected')
            ->whereBetween('created_at', [$thisMonth, $nextMonth])
            ->count();

        // Calculate upcoming leave (approved leave starting in next 7 days)
        $upcomingLeave = (clone $base)
            ->where('status', 'approved')
            ->whereDate('start_date', '>', $today)
            ->whereDate('start_date', '<=', now()->addDays(7))
            ->count();

        return response()->json([
            'total_employees' => $totalEmployees,
            'on_leave_today' => $onLeaveToday,
            'pending_requests' => $pendingRequests,
            'approved_this_month' => $approvedThisMonth,
            'rejected_this_month' => $rejectedThisMonth,
            'upcoming_leave' => $upcomingLeave,
        ]);
    }

    /**
     * Get today's leave requests
     */
    public function getTodayLeave(Request $request)
    {
        $query = LeaveRequest::query()->with(['employee']);
        
        if ($request->filled('branch_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('branch_id', $request->branch_id);
            });
        }

        $today = now()->toDateString();
        
        return $query->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->latest()
            ->get();
    }
}