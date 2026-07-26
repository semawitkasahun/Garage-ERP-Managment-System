<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $query = Budget::query()->with(['branch', 'account']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->has('period')) {
            $query->where('period', $request->period);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'account_id' => 'required|integer|exists:chart_of_accounts,account_id',
            'period' => 'nullable|string|max:20',
            'budget_amount' => 'nullable|numeric|min:0',
            'actual_amount' => 'nullable|numeric|min:0',
        ]);

        $budget = Budget::create($validated);
        return response()->json($budget, 201);
    }

    public function show(Budget $budget)
    {
        return $budget->load(['branch', 'account']);
    }

    public function update(Request $request, Budget $budget)
    {
        $validated = $request->validate([
            'budget_amount' => 'nullable|numeric|min:0',
            'actual_amount' => 'nullable|numeric|min:0',
        ]);

        $budget->update($validated);
        return $budget;
    }

    public function destroy(Budget $budget)
    {
        $budget->delete();
        return response()->noContent();
    }

    public function getByPeriod($period)
    {
        $budgets = Budget::where('period', $period)
            ->with(['branch', 'account'])
            ->get();
        return $budgets;
    }

    public function getByBranch($branchId)
    {
        $budgets = Budget::where('branch_id', $branchId)
            ->with(['account'])
            ->get();
        return $budgets;
    }

    public function getVariance($budgetId)
    {
        $budget = Budget::with(['account'])->findOrFail($budgetId);

        $variance = $budget->budget_amount - $budget->actual_amount;
        $variancePercentage = $budget->budget_amount > 0 
            ? ($variance / $budget->budget_amount) * 100 
            : 0;

        return response()->json([
            'budget' => $budget,
            'variance' => $variance,
            'variance_percentage' => $variancePercentage,
            'status' => $variance >= 0 ? 'under_budget' : 'over_budget',
        ]);
    }

    public function getSummary(Request $request)
    {
        $query = Budget::query();

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $summary = [
            'total_budget' => $query->sum('budget_amount'),
            'total_actual' => $query->sum('actual_amount'),
            'total_variance' => $query->sum('budget_amount') - $query->sum('actual_amount'),
            'by_period' => (clone $query)->select('period', 
                    \DB::raw('sum(budget_amount) as budget_total'),
                    \DB::raw('sum(actual_amount) as actual_total'),
                    \DB::raw('sum(budget_amount) - sum(actual_amount) as variance')
                )
                ->groupBy('period')
                ->get(),
        ];

        return $summary;
    }
}