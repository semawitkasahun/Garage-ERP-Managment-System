<?php

namespace App\Http\Controllers;

use App\Models\SimpleSale;
use App\Models\SimplePurchase;
use App\Models\Expense;
use App\Models\PayrollPayment;
use App\Models\CashBankTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceController extends Controller
{
    public function getDashboard(Request $request)
    {
        $now = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth()->toDateString();
        $thisMonthEnd = $now->copy()->endOfMonth()->toDateString();

        // 1. Total Income (Simple Sales paid + partial amounts)
        $totalIncome = (float) SimpleSale::sum('amount_paid');

        // 2. Total Expenses (Purchases paid + payroll paid + paid general expenses)
        $totalPurchases = (float) SimplePurchase::sum('amount_paid');
        $totalPayroll = (float) PayrollPayment::sum('amount');
        $totalGeneralExpenses = (float) Expense::where('status', 'paid')->sum('amount');
        $totalExpenses = $totalPurchases + $totalPayroll + $totalGeneralExpenses;

        // 3. Net Profit
        $netProfit = $totalIncome - $totalExpenses;

        // 4. Accounts Receivable (Simple Sales unpaid/partial balance)
        $accountsReceivable = (float) SimpleSale::sum(DB::raw('total_amount - amount_paid'));

        // 5. Accounts Payable (Simple Purchases unpaid/partial balance)
        $accountsPayable = (float) SimplePurchase::sum(DB::raw('total_amount - amount_paid'));

        // 6 & 7. Cash and Bank Balances from CashBankTransaction
        $cashDeposits = (float) CashBankTransaction::where('account', 'cash')->whereIn('type', ['deposit', 'transfer_in'])->sum('amount');
        $cashWithdrawals = (float) CashBankTransaction::where('account', 'cash')->whereIn('type', ['withdrawal', 'transfer_out'])->sum('amount');
        $cashBalance = $cashDeposits - $cashWithdrawals;

        $bankDeposits = (float) CashBankTransaction::where('account', 'bank')->whereIn('type', ['deposit', 'transfer_in'])->sum('amount');
        $bankWithdrawals = (float) CashBankTransaction::where('account', 'bank')->whereIn('type', ['withdrawal', 'transfer_out'])->sum('amount');
        $bankBalance = $bankDeposits - $bankWithdrawals;

        // 8. This Month's Income
        $thisMonthIncome = (float) SimpleSale::whereBetween('sale_date', [$thisMonthStart, $thisMonthEnd])->sum('amount_paid');

        // 9. This Month's Expenses
        $thisMonthPurchases = (float) SimplePurchase::whereBetween('purchase_date', [$thisMonthStart, $thisMonthEnd])->sum('amount_paid');
        $thisMonthPayroll = (float) PayrollPayment::whereBetween('payment_date', [$thisMonthStart, $thisMonthEnd])->sum('amount');
        $thisMonthGeneralExpenses = (float) Expense::where('status', 'paid')->whereBetween('expense_date', [$thisMonthStart, $thisMonthEnd])->sum('amount');
        $thisMonthExpenses = $thisMonthPurchases + $thisMonthPayroll + $thisMonthGeneralExpenses;

        // Recent Financial Transactions (unified feed of CashBankTransaction)
        $recentTransactions = CashBankTransaction::latest('transaction_date')
            ->latest('id')
            ->limit(10)
            ->get();

        return response()->json([
            'metrics' => [
                'total_income' => $totalIncome,
                'total_expenses' => $totalExpenses,
                'net_profit' => $netProfit,
                'accounts_receivable' => $accountsReceivable,
                'accounts_payable' => $accountsPayable,
                'cash_balance' => $cashBalance,
                'bank_balance' => $bankBalance,
                'this_month_income' => $thisMonthIncome,
                'this_month_expenses' => $thisMonthExpenses,
            ],
            'recent_transactions' => $recentTransactions,
        ]);
    }

    public function getTransactions(Request $request)
    {
        $query = CashBankTransaction::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('description', 'like', "%{$search}%");
        }

        if ($request->filled('account')) {
            $query->where('account', $request->account);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('transaction_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('transaction_date', '<=', $request->to_date);
        }

        $transactions = $query->latest('transaction_date')
            ->latest('id')
            ->paginate($request->integer('per_page', 20));

        return response()->json($transactions);
    }

    public function getCashBank(Request $request)
    {
        $cashDeposits = (float) CashBankTransaction::where('account', 'cash')->whereIn('type', ['deposit', 'transfer_in'])->sum('amount');
        $cashWithdrawals = (float) CashBankTransaction::where('account', 'cash')->whereIn('type', ['withdrawal', 'transfer_out'])->sum('amount');
        $cashBalance = $cashDeposits - $cashWithdrawals;

        $bankDeposits = (float) CashBankTransaction::where('account', 'bank')->whereIn('type', ['deposit', 'transfer_in'])->sum('amount');
        $bankWithdrawals = (float) CashBankTransaction::where('account', 'bank')->whereIn('type', ['withdrawal', 'transfer_out'])->sum('amount');
        $bankBalance = $bankDeposits - $bankWithdrawals;

        $query = CashBankTransaction::query();

        if ($request->filled('account')) {
            $query->where('account', $request->account);
        }

        $history = $query->latest('transaction_date')
            ->latest('id')
            ->paginate($request->integer('per_page', 20));

        // Add running balances calculated on server side for simple display
        // Since it's paginated, we just display the historical amounts
        return response()->json([
            'cash_balance' => $cashBalance,
            'bank_balance' => $bankBalance,
            'available_funds' => $cashBalance + $bankBalance,
            'history' => $history
        ]);
    }

    public function recordCashBank(Request $request)
    {
        $validated = $request->validate([
            'transaction_date' => 'required|date',
            'description' => 'required|string|max:255',
            'type' => 'required|in:deposit,withdrawal,transfer',
            'account' => 'required_if:type,deposit,withdrawal|in:cash,bank',
            'from_account' => 'required_if:type,transfer|in:cash,bank', // for transfers
            'amount' => 'required|numeric|min:0.01',
        ]);

        return DB::transaction(function () use ($validated) {
            $type = $validated['type'];
            $amount = (float) $validated['amount'];

            if ($type === 'transfer') {
                $from = $validated['from_account'];
                $to = $from === 'cash' ? 'bank' : 'cash';

                // Cash/Bank transaction transfer out
                CashBankTransaction::create([
                    'transaction_date' => $validated['transaction_date'],
                    'description' => $validated['description'] . " (Transfer out)",
                    'type' => 'transfer_out',
                    'account' => $from,
                    'amount' => $amount,
                    'reference_type' => 'manual',
                ]);

                // Cash/Bank transaction transfer in
                CashBankTransaction::create([
                    'transaction_date' => $validated['transaction_date'],
                    'description' => $validated['description'] . " (Transfer in)",
                    'type' => 'transfer_in',
                    'account' => $to,
                    'amount' => $amount,
                    'reference_type' => 'manual',
                ]);
            } else {
                CashBankTransaction::create([
                    'transaction_date' => $validated['transaction_date'],
                    'description' => $validated['description'],
                    'type' => $type, // deposit or withdrawal
                    'account' => $validated['account'],
                    'amount' => $amount,
                    'reference_type' => 'manual',
                ]);
            }

            return response()->json(['message' => 'Transaction recorded successfully'], 201);
        });
    }

    public function getReceivables(Request $request)
    {
        // Simple Sales where payment_status is unpaid or partial
        $sales = SimpleSale::with(['customer'])
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->latest('sale_date')
            ->paginate($request->integer('per_page', 20));

        return response()->json($sales);
    }

    public function getPayables(Request $request)
    {
        // Simple Purchases where payment_status is unpaid or partial
        $purchases = SimplePurchase::with(['supplier'])
            ->whereIn('payment_status', ['unpaid', 'partial'])
            ->latest('purchase_date')
            ->paginate($request->integer('per_page', 20));

        return response()->json($purchases);
    }

    public function getReports(Request $request)
    {
        $from = $request->input('from_date', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to_date', Carbon::now()->endOfMonth()->toDateString());
        $reportType = $request->input('type', 'profit_loss');

        switch ($reportType) {
            case 'income':
                $data = SimpleSale::with(['customer'])
                    ->whereBetween('sale_date', [$from, $to])
                    ->latest('sale_date')
                    ->get();
                break;
            case 'expense':
                $purchases = SimplePurchase::with(['supplier'])
                    ->whereBetween('purchase_date', [$from, $to])
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => $item->purchase_date->toDateString(),
                            'category' => 'Supplier Purchases',
                            'description' => 'Supplier purchase: ' . $item->purchase_number,
                            'amount' => $item->amount_paid,
                            'reference' => $item->purchase_number,
                        ];
                    });

                $expenses = Expense::with(['supplier'])
                    ->where('status', 'paid')
                    ->whereBetween('expense_date', [$from, $to])
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => $item->expense_date->toDateString(),
                            'category' => $item->category ?: 'General Expenses',
                            'description' => $item->description ?: 'Operating expense',
                            'amount' => $item->amount,
                            'reference' => $item->reference_no ?: 'EXP-' . $item->expense_id,
                        ];
                    });

                $payroll = PayrollPayment::with(['employee'])
                    ->whereBetween('payment_date', [$from, $to])
                    ->get()
                    ->map(function ($item) {
                        return [
                            'date' => $item->payment_date->toDateString(),
                            'category' => 'Payroll Cost',
                            'description' => 'Salary payment for ' . ($item->employee->first_name ?? '') . ' ' . ($item->employee->last_name ?? ''),
                            'amount' => $item->amount,
                            'reference' => $item->receipt_number,
                        ];
                    });

                $data = $purchases->concat($expenses)->concat($payroll)->sortByDesc('date')->values();
                break;
            case 'receivables':
                $data = SimpleSale::with(['customer'])
                    ->whereIn('payment_status', ['unpaid', 'partial'])
                    ->latest('sale_date')
                    ->get();
                break;
            case 'payables':
                $data = SimplePurchase::with(['supplier'])
                    ->whereIn('payment_status', ['unpaid', 'partial'])
                    ->latest('purchase_date')
                    ->get();
                break;
            case 'payroll':
                $data = PayrollPayment::with(['employee', 'payrollPeriod'])
                    ->whereBetween('payment_date', [$from, $to])
                    ->latest('payment_date')
                    ->get();
                break;
            case 'cash_bank':
                $data = CashBankTransaction::whereBetween('transaction_date', [$from, $to])
                    ->latest('transaction_date')
                    ->latest('id')
                    ->get();
                break;
            case 'transactions':
                $data = CashBankTransaction::whereBetween('transaction_date', [$from, $to])
                    ->latest('transaction_date')
                    ->latest('id')
                    ->get();
                break;
            case 'profit_loss':
            default:
                // Profit & Loss Report Summary
                $income = (float) SimpleSale::whereBetween('sale_date', [$from, $to])->sum('amount_paid');
                $purchasesCost = (float) SimplePurchase::whereBetween('purchase_date', [$from, $to])->sum('amount_paid');
                $payrollCost = (float) PayrollPayment::whereBetween('payment_date', [$from, $to])->sum('amount');
                $operatingExpenses = (float) Expense::where('status', 'paid')->whereBetween('expense_date', [$from, $to])->sum('amount');

                $totalExp = $purchasesCost + $payrollCost + $operatingExpenses;

                $data = [
                    'income' => $income,
                    'expenses' => [
                        'purchases' => $purchasesCost,
                        'payroll' => $payrollCost,
                        'operating_expenses' => $operatingExpenses,
                        'total' => $totalExp,
                    ],
                    'net_profit' => $income - $totalExp,
                ];
                break;
        }

        return response()->json([
            'from_date' => $from,
            'to_date' => $to,
            'report_type' => $reportType,
            'data' => $data,
        ]);
    }
}
