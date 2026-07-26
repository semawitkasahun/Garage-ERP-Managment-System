<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query()->with(['branch', 'approvedBy']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('expense_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('expense_date', '<=', $request->to_date);
        }

        if ($request->has('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }

        if ($request->has('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'category' => 'nullable|string|max:50',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:20',
            'expense_date' => 'nullable|date',
        ]);

        $expense = Expense::create($validated);
        return response()->json($expense, 201);
    }

    public function show(Expense $expense)
    {
        return $expense->load(['branch', 'approvedBy']);
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'category' => 'nullable|string|max:50',
            'amount' => 'nullable|numeric|min:0.01',
            'description' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:20',
        ]);

        $expense->update($validated);
        return $expense;
    }

    public function destroy(Expense $expense)
    {
        if ($expense->status === 'approved') {
            return response()->json([
                'message' => 'Cannot delete approved expense'
            ], 422);
        }

        $expense->delete();
        return response()->noContent();
    }

    public function approve(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'approved_by' => 'required|integer|exists:users,user_id',
        ]);

        $expense->update([
            'status' => 'approved',
            'approved_by' => $validated['approved_by'],
        ]);
        return $expense;
    }

    public function reject(Expense $expense)
    {
        $expense->update(['status' => 'rejected']);
        return $expense;
    }

    public function pay(Expense $expense)
    {
        $expense->update(['status' => 'paid']);
        return $expense;
    }

    public function getByCategory($category)
    {
        $expenses = Expense::where('category', $category)
            ->with(['branch'])
            ->latest()
            ->get();
        return $expenses;
    }

    public function getByBranch($branchId)
    {
        $expenses = Expense::where('branch_id', $branchId)
            ->with(['approvedBy'])
            ->latest()
            ->get();
        return $expenses;
    }

    public function getPending()
    {
        $expenses = Expense::where('status', 'pending')
            ->with(['branch'])
            ->latest()
            ->get();
        return $expenses;
    }

    public function getSummary(Request $request)
    {
        $query = Expense::query();

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $summary = [
            'total_expenses' => $query->count(),
            'by_status' => (clone $query)->select('status', \DB::raw('count(*) as count'), \DB::raw('sum(amount) as total'))
                ->groupBy('status')
                ->get(),
            'by_category' => (clone $query)->select('category', \DB::raw('count(*) as count'), \DB::raw('sum(amount) as total'))
                ->whereNotNull('category')
                ->groupBy('category')
                ->get(),
            'total_amount' => $query->sum('amount'),
            'this_month_total' => (clone $query)->whereMonth('expense_date', now()->month)->sum('amount'),
        ];

        return $summary;
    }
}