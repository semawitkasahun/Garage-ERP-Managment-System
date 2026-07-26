<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use Illuminate\Http\Request;

class BankAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = BankAccount::query()->with(['branch']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('currency')) {
            $query->where('currency', $request->currency);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:10',
        ]);

        $account = BankAccount::create($validated);
        return response()->json($account, 201);
    }

    public function show(BankAccount $bankAccount)
    {
        return $bankAccount->load([
            'branch',
            'reconciliations' => function ($query) {
                $query->latest()->limit(10);
            }
        ]);
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        $validated = $request->validate([
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'currency' => 'nullable|string|max:10',
        ]);

        $bankAccount->update($validated);
        return $bankAccount;
    }

    public function destroy(BankAccount $bankAccount)
    {
        $bankAccount->delete();
        return response()->noContent();
    }

    public function getByBranch($branchId)
    {
        $accounts = BankAccount::where('branch_id', $branchId)
            ->with(['reconciliations'])
            ->get();
        return $accounts;
    }

    public function getBalance($accountId)
    {
        $account = BankAccount::with(['reconciliations' => function ($query) {
            $query->latest()->first();
        }])->findOrFail($accountId);

        $latestReconciliation = $account->reconciliations->first();

        return response()->json([
            'account' => $account,
            'current_balance' => $latestReconciliation?->book_balance ?? 0,
            'statement_balance' => $latestReconciliation?->statement_balance ?? 0,
        ]);
    }
}