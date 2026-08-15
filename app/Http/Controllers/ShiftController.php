<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::query()->with(['branch']);

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
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
            'department_id' => 'nullable|integer|exists:departments,department_id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'break_start' => 'nullable|date_format:H:i',
            'break_end' => 'nullable|date_format:H:i|after:break_start',
            'break_duration_minutes' => 'nullable|integer|min:0',
            'expected_hours' => 'nullable|numeric|min:0',
            'overtime_threshold' => 'nullable|numeric|min:0',
            'overtime_rate' => 'nullable|numeric|min:0',
            'grace_period_minutes' => 'nullable|integer|min:0',
            'pattern' => 'nullable|in:daily,weekly,custom',
            'working_days' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $shift = Shift::create($validated);
        return response()->json($shift, 201);
    }

    public function show(Shift $shift)
    {
        return $shift->load(['branch', 'employees']);
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'branch_id' => 'sometimes|nullable|integer|exists:branches,branch_id',
            'department_id' => 'sometimes|nullable|integer|exists:departments,department_id',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',
            'break_start' => 'sometimes|nullable|date_format:H:i',
            'break_end' => 'sometimes|nullable|date_format:H:i|after:break_start',
            'break_duration_minutes' => 'sometimes|nullable|integer|min:0',
            'expected_hours' => 'sometimes|nullable|numeric|min:0',
            'overtime_threshold' => 'sometimes|nullable|numeric|min:0',
            'overtime_rate' => 'sometimes|nullable|numeric|min:0',
            'grace_period_minutes' => 'sometimes|nullable|integer|min:0',
            'pattern' => 'sometimes|nullable|in:daily,weekly,custom',
            'working_days' => 'sometimes|nullable|array',
            'is_active' => 'sometimes|boolean',
        ]);

        $shift->update($validated);
        return $shift;
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();
        return response()->noContent();
    }

    public function assignEmployee(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'effective_date' => 'required|date',
            'end_date' => 'nullable|date|after:effective_date',
            'is_primary' => 'boolean',
        ]);

        $shift->employees()->attach($validated['employee_id'], [
            'effective_date' => $validated['effective_date'],
            'end_date' => $validated['end_date'] ?? null,
            'is_primary' => $validated['is_primary'] ?? true,
        ]);

        return response()->json(['message' => 'Employee assigned to shift successfully'], 201);
    }

    public function removeEmployee(Request $request, Shift $shift, $employeeId)
    {
        $shift->employees()->wherePivot('employee_id', $employeeId)->detach();
        return response()->noContent();
    }

    public function getEmployees(Shift $shift)
    {
        return $shift->employees()->withPivot('effective_date', 'end_date', 'is_primary')->get();
    }
}
