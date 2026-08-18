<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use App\Models\PayrollPeriod;
use Illuminate\Http\Request;

class PayrollRunController extends Controller
{
    public function index(Request $request)
    {
        $query = PayrollRun::query()->with(['branch', 'approvedBy', 'payrollPeriod']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('payroll_period_id')) {
            $query->where('payroll_period_id', $request->payroll_period_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('period_start', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('period_end', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'payroll_period_id' => 'nullable|integer|exists:payroll_periods,payroll_period_id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
            'name' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:30',
        ]);

        $validated['status'] = $validated['status'] ?? 'draft';
        
        $payroll = PayrollRun::create($validated);
        return response()->json($payroll->load(['branch', 'payrollPeriod']), 201);
    }

    public function show(PayrollRun $payrollRun)
    {
        return $payrollRun->load([
            'branch',
            'approvedBy',
            'payrollPeriod',
            'items' => function ($query) {
                $query->with(['employee', 'salaryStructure', 'payrollAllowances.allowance', 'payrollDeductions.deduction']);
            }
        ]);
    }

    public function update(Request $request, PayrollRun $payrollRun)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:30',
            'total_gross_pay' => 'nullable|numeric|min:0',
            'total_deductions' => 'nullable|numeric|min:0',
            'total_net_pay' => 'nullable|numeric|min:0',
            'total_employees' => 'nullable|integer|min:0',
        ]);

        // Prevent editing if already processed
        if (in_array($payrollRun->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Cannot edit payroll run that has been approved or paid'
            ], 422);
        }

        $payrollRun->update($validated);
        return $payrollRun->load(['branch', 'payrollPeriod']);
    }

    public function destroy(PayrollRun $payrollRun)
    {
        if (in_array($payrollRun->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Cannot delete payroll run that has been approved or paid'
            ], 422);
        }

        $payrollRun->delete();
        return response()->noContent();
    }

    public function process(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft payroll runs can be processed'
            ], 422);
        }

        $payrollRun->update([
            'status' => 'processing',
            'processed_at' => now(),
        ]);
        return $payrollRun;
    }

    public function calculate(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'processing') {
            return response()->json([
                'message' => 'Only processing payroll runs can be calculated'
            ], 422);
        }

        // Calculate totals from items
        $items = $payrollRun->items;
        $totalGross = $items->sum('gross_salary');
        $totalDeductions = $items->sum(function ($item) {
            return $item->payrollDeductions->sum('amount');
        });
        $totalNet = $items->sum('net_pay');

        $payrollRun->update([
            'total_gross_pay' => $totalGross,
            'total_deductions' => $totalDeductions,
            'total_net_pay' => $totalNet,
            'total_employees' => $items->count(),
            'calculated_at' => now(),
            'status' => 'pending_approval',
        ]);

        return $payrollRun->load(['items']);
    }

    public function approve(Request $request, PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'pending_approval') {
            return response()->json([
                'message' => 'Only pending approval payroll runs can be approved'
            ], 422);
        }

        $payrollRun->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->user_id,
        ]);

        return $payrollRun->load(['approvedBy']);
    }

    public function markAsPaid(PayrollRun $payrollRun)
    {
        if ($payrollRun->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved payroll runs can be marked as paid'
            ], 422);
        }

        $payrollRun->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return $payrollRun;
    }

    public function getByBranch($branchId)
    {
        $payrolls = PayrollRun::where('branch_id', $branchId)
            ->with(['items', 'payrollPeriod'])
            ->latest()
            ->get();
        return $payrolls;
    }

    public function getByPayrollPeriod($payrollPeriodId)
    {
        $payrolls = PayrollRun::where('payroll_period_id', $payrollPeriodId)
            ->with(['branch', 'items'])
            ->latest()
            ->get();
        return $payrolls;
    }

    public function getPending()
    {
        $payrolls = PayrollRun::where('status', 'pending_approval')
            ->with(['branch', 'payrollPeriod'])
            ->latest()
            ->get();
        return $payrolls;
    }

    public function getSummary()
    {
        $summary = [
            'total_payrolls' => PayrollRun::count(),
            'by_status' => PayrollRun::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'total_payroll_cost' => PayrollRun::sum('total_net_pay'),
            'current_month' => PayrollRun::whereMonth('period_start', now()->month)
                ->whereYear('period_start', now()->year)
                ->sum('total_net_pay'),
        ];
        return $summary;
    }
}