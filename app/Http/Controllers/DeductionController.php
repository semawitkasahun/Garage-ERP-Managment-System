<?php

namespace App\Http\Controllers;

use App\Models\Deduction;
use Illuminate\Http\Request;

class DeductionController extends Controller
{
    public function index(Request $request)
    {
        $query = Deduction::query()->with(['branch']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('deduction_type')) {
            $query->where('deduction_type', $request->deduction_type);
        }

        return $query->byPriority()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:deductions,code',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'calculation_type' => 'required|string|in:fixed,percentage_of_basic,percentage_of_gross,percentage_of_taxable',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'priority' => 'nullable|integer|min:0',
            'deduction_type' => 'required|string|in:standard,tax,pension,loan,advance,other',
            'applies_to_all' => 'nullable|boolean',
            'applicable_employee_ids' => 'nullable|array',
            'applicable_employee_ids.*' => 'integer|exists:employees,employee_id',
            'applicable_department_ids' => 'nullable|array',
            'applicable_department_ids.*' => 'integer|exists:departments,department_id',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['applies_to_all'] = $validated['applies_to_all'] ?? true;
        $validated['priority'] = $validated['priority'] ?? 0;
        
        $deduction = Deduction::create($validated);
        return response()->json($deduction->load(['branch']), 201);
    }

    public function show(Deduction $deduction)
    {
        return $deduction->load(['branch']);
    }

    public function update(Request $request, Deduction $deduction)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50|unique:deductions,code,' . $deduction->deduction_id . ',deduction_id',
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'calculation_type' => 'nullable|string|in:fixed,percentage_of_basic,percentage_of_gross,percentage_of_taxable',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'priority' => 'nullable|integer|min:0',
            'deduction_type' => 'nullable|string|in:standard,tax,pension,loan,advance,other',
            'applies_to_all' => 'nullable|boolean',
            'applicable_employee_ids' => 'nullable|array',
            'applicable_employee_ids.*' => 'integer|exists:employees,employee_id',
            'applicable_department_ids' => 'nullable|array',
            'applicable_department_ids.*' => 'integer|exists:departments,department_id',
            'is_active' => 'nullable|boolean',
        ]);

        $deduction->update($validated);
        return $deduction->load(['branch']);
    }

    public function destroy(Deduction $deduction)
    {
        $deduction->delete();
        return response()->noContent();
    }

    public function getActive()
    {
        $deductions = Deduction::active()->byPriority()->with(['branch'])->get();
        return $deductions;
    }

    public function getByType($type)
    {
        $deductions = Deduction::where('deduction_type', $type)
            ->active()
            ->byPriority()
            ->with(['branch'])
            ->get();
        return $deductions;
    }

    public function getTax()
    {
        return $this->getByType('tax');
    }

    public function getPension()
    {
        return $this->getByType('pension');
    }

    public function getLoans()
    {
        return $this->getByType('loan');
    }

    public function getAdvances()
    {
        return $this->getByType('advance');
    }
}
