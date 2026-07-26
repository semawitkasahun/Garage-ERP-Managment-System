<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        return Employee::query()
            ->with(['branch', 'user'])
            ->latest()
            ->paginate($request->integer('per_page', 20));//
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'job_title' => 'nullable|string|max:50',
            'hire_date' => 'nullable|date',
            'phone' => 'nullable|string|max:30',
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