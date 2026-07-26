<?php

namespace App\Http\Controllers;

use App\Models\BankReconciliation;
use Illuminate\Http\Request;

class BankReconciliationController extends Controller
{
    public function index(Request $request)
    {
        $query = BankReconciliation::query()->with(['bankAccount', 'reconciledBy']);

        if ($request->has('bank_account_id')) {
            $query->where('bank_account_id', $request->bank_account_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('statement_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('statement_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|integer|exists:bank_accounts,bank_account_id',
            'statement_date' => 'nullable|date',
            'statement_balance' => 'nullable|numeric|min:0',
            'book_balance' => 'nullable|numeric|min:0',
            'reconciled_by' => 'required|integer|exists:users,user_id',
        ]);

        $reconciliation = BankReconciliation::create($validated);
        return response()->json($reconciliation, 201);
    }

    public function show(BankReconciliation $bankReconciliation)
    {
        return $bankReconciliation->load(['bankAccount', 'reconciledBy']);
    }

    public function update(Request $request, BankReconciliation $bankReconciliation)
    {
        $validated = $request->validate([
            'statement_balance' => 'nullable|numeric|min:0',
            'book_balance' => 'nullable|numeric|min:0',
        ]);

        $bankReconciliation->update($validated);
        return $bankReconciliation;
    }

    public function destroy(BankReconciliation $bankReconciliation)
    {
        $bankReconciliation->delete();
        return response()->noContent();
    }

    public function getByAccount($bankAccountId)
    {
        $reconciliations = BankReconciliation::where('bank_account_id', $bankAccountId)
            ->with(['reconciledBy'])
            ->latest()
            ->get();
        return $reconciliations;
    }

    public function getLatest($bankAccountId)
    {
        $reconciliation = BankReconciliation::where('bank_account_id', $bankAccountId)
            ->latest()
            ->first();

        return $reconciliation ?? response()->json(['message' => 'No reconciliation found'], 404);
    }
}