<?php

namespace App\Http\Controllers;

use App\Models\GeneralLedgerEntry;
use Illuminate\Http\Request;
use App\Models\ChartOfAccount;

class GeneralLedgerEntryController extends Controller
{
    public function index(Request $request)
    {
        $query = GeneralLedgerEntry::query()->with(['account', 'branch', 'createdBy']);

        if ($request->has('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        if ($request->has('reference_id')) {
            $query->where('reference_id', $request->reference_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('entry_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('entry_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|integer|exists:chart_of_accounts,account_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'reference_type' => 'nullable|string|max:30',
            'reference_id' => 'nullable|integer',
            'debit' => 'nullable|numeric|min:0',
            'credit' => 'nullable|numeric|min:0',
            'entry_date' => 'nullable|date',
            'created_by' => 'required|integer|exists:users,user_id',
        ]);

        // Ensure either debit or credit is provided
        if (!isset($validated['debit']) && !isset($validated['credit'])) {
            return response()->json([
                'message' => 'Either debit or credit must be provided'
            ], 422);
        }

        $entry = GeneralLedgerEntry::create($validated);
        return response()->json($entry, 201);
    }

    public function show(GeneralLedgerEntry $generalLedgerEntry)
    {
        return $generalLedgerEntry->load(['account', 'branch', 'createdBy']);
    }

    public function update(Request $request, GeneralLedgerEntry $generalLedgerEntry)
    {
        $validated = $request->validate([
            'debit' => 'nullable|numeric|min:0',
            'credit' => 'nullable|numeric|min:0',
        ]);

        $generalLedgerEntry->update($validated);
        return $generalLedgerEntry;
    }

    public function destroy(GeneralLedgerEntry $generalLedgerEntry)
    {
        $generalLedgerEntry->delete();
        return response()->noContent();
    }

    public function getByAccount($accountId)
    {
        $entries = GeneralLedgerEntry::where('account_id', $accountId)
            ->with(['branch', 'createdBy'])
            ->latest()
            ->get();
        return $entries;
    }

    public function getByReference($referenceType, $referenceId)
    {
        $entries = GeneralLedgerEntry::where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            ->with(['account', 'branch'])
            ->get();
        return $entries;
    }

    public function getBalance($accountId)
    {
        $account = ChartOfAccount::findOrFail($accountId);
        
        $totalDebit = GeneralLedgerEntry::where('account_id', $accountId)->sum('debit');
        $totalCredit = GeneralLedgerEntry::where('account_id', $accountId)->sum('credit');

        $balance = $totalDebit - $totalCredit;

        return response()->json([
            'account' => $account,
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'balance' => $balance,
        ]);
    }

    public function getTrialBalance(Request $request)
    {
        $validated = $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
        ]);

        $entries = GeneralLedgerEntry::with(['account'])
            ->whereBetween('entry_date', [$validated['from_date'], $validated['to_date']])
            ->get();

        $trialBalance = $entries->groupBy('account_id')->map(function ($group) {
            $account = $group->first()->account;
            $debit = $group->sum('debit');
            $credit = $group->sum('credit');
            return [
                'account_code' => $account->code,
                'account_name' => $account->name,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $debit - $credit,
            ];
        });

        return $trialBalance->values();
    }
}