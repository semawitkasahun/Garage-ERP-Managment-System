<?php

namespace App\Http\Controllers;

use App\Models\EmployeeSalaryStructure;
use Illuminate\Http\Request;

class EmployeeSalaryStructureController extends Controller
{
    public function index(Request $request)
    {
        $query = EmployeeSalaryStructure::query()->with(['employee', 'salaryStructure']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('salary_structure_id')) {
            $query->where('salary_structure_id', $request->salary_structure_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'salary_structure_id' => 'required|integer|exists:salary_structures,salary_structure_id',
            'basic_salary_override' => 'nullable|numeric|min:0',
            'overtime_rate_override' => 'nullable|numeric|min:0',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        
        // Deactivate previous assignments for this employee
        $employee = \App\Models\Employee::find($validated['employee_id']);
        $employee->employeeSalaryStructures()->where('is_active', true)->update([
            'is_active' => false,
            'end_date' => now(),
        ]);

        $assignment = EmployeeSalaryStructure::create($validated);
        return response()->json($assignment->load(['employee', 'salaryStructure']), 201);
    }

    public function show(EmployeeSalaryStructure $employeeSalaryStructure)
    {
        return $employeeSalaryStructure->load(['employee', 'salaryStructure']);
    }

    public function update(Request $request, EmployeeSalaryStructure $employeeSalaryStructure)
    {
        $validated = $request->validate([
            'basic_salary_override' => 'nullable|numeric|min:0',
            'overtime_rate_override' => 'nullable|numeric|min:0',
            'end_date' => 'nullable|date|after:effective_date',
            'is_active' => 'nullable|boolean',
        ]);

        $employeeSalaryStructure->update($validated);
        return $employeeSalaryStructure->load(['employee', 'salaryStructure']);
    }

    public function destroy(EmployeeSalaryStructure $employeeSalaryStructure)
    {
        $employeeSalaryStructure->delete();
        return response()->noContent();
    }

    public function getCurrent($employeeId)
    {
        $current = EmployeeSalaryStructure::with(['employee', 'salaryStructure'])
            ->forEmployee($employeeId)
            ->current()
            ->first();
        
        if (!$current) {
            return response()->json(['message' => 'No current salary structure found'], 404);
        }

        return $current;
    }

    public function getHistory($employeeId)
    {
        $history = EmployeeSalaryStructure::with(['salaryStructure'])
            ->forEmployee($employeeId)
            ->latest()
            ->get();
        return $history;
    }
}
