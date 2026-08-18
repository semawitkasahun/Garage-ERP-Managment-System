<?php

namespace App\Http\Controllers;

use App\Models\SalaryStructure;
use Illuminate\Http\Request;

class SalaryStructureController extends Controller
{
    public function index(Request $request)
    {
        $query = SalaryStructure::query()->with(['branch', 'department']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
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
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'department_id' => 'nullable|integer|exists:departments,department_id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:salary_structures,code',
            'description' => 'nullable|string',
            'basic_salary' => 'required|numeric|min:0',
            'salary_type' => 'required|string|in:monthly,daily,hourly',
            'payment_frequency' => 'required|string|in:weekly,bi-weekly,monthly',
            'overtime_rate' => 'nullable|numeric|min:0',
            'overtime_calculation' => 'nullable|string|in:standard,double,custom',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'taxable' => 'nullable|boolean',
            'working_days_per_month' => 'nullable|integer|min:1|max:31',
            'working_hours_per_day' => 'nullable|integer|min:1|max:24',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['taxable'] = $validated['taxable'] ?? true;
        
        $salaryStructure = SalaryStructure::create($validated);
        return response()->json($salaryStructure->load(['branch', 'department']), 201);
    }

    public function show(SalaryStructure $salaryStructure)
    {
        return $salaryStructure->load([
            'branch',
            'department',
            'employeeSalaryStructures' => function ($query) {
                $query->with(['employee'])->active();
            }
        ]);
    }

    public function update(Request $request, SalaryStructure $salaryStructure)
    {
        $validated = $request->validate([
            'department_id' => 'nullable|integer|exists:departments,department_id',
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50|unique:salary_structures,code,' . $salaryStructure->salary_structure_id . ',salary_structure_id',
            'description' => 'nullable|string',
            'basic_salary' => 'nullable|numeric|min:0',
            'salary_type' => 'nullable|string|in:monthly,daily,hourly',
            'payment_frequency' => 'nullable|string|in:weekly,bi-weekly,monthly',
            'overtime_rate' => 'nullable|numeric|min:0',
            'overtime_calculation' => 'nullable|string|in:standard,double,custom',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'taxable' => 'nullable|boolean',
            'working_days_per_month' => 'nullable|integer|min:1|max:31',
            'working_hours_per_day' => 'nullable|integer|min:1|max:24',
            'is_active' => 'nullable|boolean',
        ]);

        $salaryStructure->update($validated);
        return $salaryStructure->load(['branch', 'department']);
    }

    public function destroy(SalaryStructure $salaryStructure)
    {
        // Check if salary structure is assigned to any active employees
        $activeAssignments = $salaryStructure->employeeSalaryStructures()->active()->count();
        if ($activeAssignments > 0) {
            return response()->json([
                'message' => 'Cannot delete salary structure with active employee assignments'
            ], 422);
        }

        $salaryStructure->delete();
        return response()->noContent();
    }

    public function assignToEmployee(Request $request, SalaryStructure $salaryStructure)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'basic_salary_override' => 'nullable|numeric|min:0',
            'overtime_rate_override' => 'nullable|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        // Deactivate previous assignments for this employee
        $employee = \App\Models\Employee::find($validated['employee_id']);
        $employee->employeeSalaryStructures()->where('is_active', true)->update([
            'is_active' => false,
            'end_date' => now(),
        ]);

        // Create new assignment
        $assignment = $salaryStructure->employeeSalaryStructures()->create([
            'employee_id' => $validated['employee_id'],
            'basic_salary_override' => $validated['basic_salary_override'],
            'overtime_rate_override' => $validated['overtime_rate_override'],
            'effective_date' => $validated['effective_date'],
            'is_active' => true,
        ]);

        return response()->json($assignment->load(['employee', 'salaryStructure']), 201);
    }

    public function getActive()
    {
        $structures = SalaryStructure::active()->with(['branch', 'department'])->get();
        return $structures;
    }

    public function getByDepartment($departmentId)
    {
        $structures = SalaryStructure::forDepartment($departmentId)
            ->with(['branch', 'department'])
            ->get();
        return $structures;
    }
}
