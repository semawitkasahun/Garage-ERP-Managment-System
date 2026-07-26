<?php

namespace App\Http\Controllers;

use App\Models\ChartOfAccount;
use Illuminate\Http\Request;

class ChartOfAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = ChartOfAccount::query();

        if ($request->has('account_type')) {
            $query->where('account_type', $request->account_type);
        }

        if ($request->has('parent_account_id')) {
            $query->where('parent_account_id', $request->parent_account_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', '%' . $search . '%')
                  ->orWhere('name', 'like', '%' . $search . '%');
            });
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:20|unique:chart_of_accounts,code',
            'name' => 'required|string|max:150',
            'account_type' => 'required|string|max:20',
            'parent_account_id' => 'nullable|integer|exists:chart_of_accounts,account_id',
        ]);

        $account = ChartOfAccount::create($validated);
        return response()->json($account, 201);
    }

    public function show(ChartOfAccount $chartOfAccount)
    {
        return $chartOfAccount->load([
            'parent',
            'children',
            'ledgerEntries' => function ($query) {
                $query->latest()->limit(10);
            },
            'budgets'
        ]);
    }

    public function update(Request $request, ChartOfAccount $chartOfAccount)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'parent_account_id' => 'nullable|integer|exists:chart_of_accounts,account_id',
        ]);

        $chartOfAccount->update($validated);
        return $chartOfAccount;
    }

    public function destroy(ChartOfAccount $chartOfAccount)
    {
        if ($chartOfAccount->children()->exists()) {
            return response()->json([
                'message' => 'Cannot delete account with child accounts'
            ], 422);
        }

        if ($chartOfAccount->ledgerEntries()->exists()) {
            return response()->json([
                'message' => 'Cannot delete account with ledger entries'
            ], 422);
        }

        $chartOfAccount->delete();
        return response()->noContent();
    }

    public function getByType($type)
    {
        $accounts = ChartOfAccount::where('account_type', $type)
            ->with(['children'])
            ->get();
        return $accounts;
    }

    public function getTree()
    {
        $accounts = ChartOfAccount::whereNull('parent_account_id')
            ->with(['children' => function ($query) {
                $query->with(['children']);
            }])
            ->get();
        return $accounts;
    }
}