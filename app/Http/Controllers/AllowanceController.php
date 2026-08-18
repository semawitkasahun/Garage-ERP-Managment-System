<?php

namespace App\Http\Controllers;

use App\Models\Allowance;
use Illuminate\Http\Request;

class AllowanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Allowance::query()->with(['branch']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('is_taxable')) {
            $query->where('is_taxable', $request->boolean('is_taxable'));
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:allowances,code',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'calculation_type' => 'required|string|in:fixed,percentage_of_basic,percentage_of_gross',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'is_taxable' => 'nullable|boolean',
            'applies_to_all' => 'nullable|boolean',
            'applicable_employee_ids' => 'nullable|array',
            'applicable_employee_ids.*' => 'integer|exists:employees,employee_id',
            'applicable_department_ids' => 'nullable|array',
            'applicable_department_ids.*' => 'integer|exists:departments,department_id',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['is_taxable'] = $validated['is_taxable'] ?? true;
        $validated['applies_to_all'] = $validated['applies_to_all'] ?? true;
        
        $allowance = Allowance::create($validated);
        return response()->json($allowance->load(['branch']), 201);
    }

    public function show(Allowance $allowance)
    {
        return $allowance->load(['branch']);
    }

    public function update(Request $request, Allowance $allowance)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:50|unique:allowances,code,' . $allowance->allowance_id . ',allowance_id',
            'description' => 'nullable|string',
            'amount' => 'nullable|numeric|min:0',
            'calculation_type' => 'nullable|string|in:fixed,percentage_of_basic,percentage_of_gross',
            'percentage_value' => 'nullable|numeric|min:0|max:100',
            'is_taxable' => 'nullable|boolean',
            'applies_to_all' => 'nullable|boolean',
            'applicable_employee_ids' => 'nullable|array',
            'applicable_employee_ids.*' => 'integer|exists:employees,employee_id',
            'applicable_department_ids' => 'nullable|array',
            'applicable_department_ids.*' => 'integer|exists:departments,department_id',
            'is_active' => 'nullable|boolean',
        ]);

        $allowance->update($validated);
        return $allowance->load(['branch']);
    }

    public function destroy(Allowance $allowance)
    {
        $allowance->delete();
        return response()->noContent();
    }

    public function getActive()
    {
        $allowances = Allowance::active()->with(['branch'])->get();
        return $allowances;
    }

    public function getTaxable()
    {
        $allowances = Allowance::taxable()->active()->with(['branch'])->get();
        return $allowances;
    }

    public function getNonTaxable()
    {
        $allowances = Allowance::nonTaxable()->active()->with(['branch'])->get();
        return $allowances;
    }
}
