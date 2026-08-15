<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Department::query()->with(['branch', 'manager']);

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20|unique:departments',
            'description' => 'nullable|string',
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
            'manager_id' => 'nullable|integer|exists:employees,employee_id',
            'is_active' => 'boolean',
        ]);

        $department = Department::create($validated);
        return response()->json($department, 201);
    }

    public function show(Department $department)
    {
        return $department->load(['branch', 'manager', 'employees', 'shifts']);
    }

    public function update(Request $request, Department $department)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'code' => 'sometimes|nullable|string|max:20|unique:departments,code,' . $department->department_id . ',department_id',
            'description' => 'sometimes|nullable|string',
            'branch_id' => 'sometimes|nullable|integer|exists:branches,branch_id',
            'manager_id' => 'sometimes|nullable|integer|exists:employees,employee_id',
            'is_active' => 'sometimes|boolean',
        ]);

        $department->update($validated);
        return $department;
    }

    public function destroy(Department $department)
    {
        $department->delete();
        return response()->noContent();
    }

    public function getEmployees(Department $department)
    {
        return $department->employees()->with(['user', 'shifts'])->get();
    }

    public function getShifts(Department $department)
    {
        return $department->shifts()->with(['branch', 'department'])->get();
    }
}
