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
            'leave_type' => 'nullable|string|max:30',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'nullable|string|max:20',
        ]);

        $leave = LeaveRequest::create($validated);
        return response()->json($leave, 201);
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
        ]);
        return $leaveRequest;
    }

    public function reject(LeaveRequest $leaveRequest)
    {
        $leaveRequest->update(['status' => 'rejected']);
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
}