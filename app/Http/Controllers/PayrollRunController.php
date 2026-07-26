<?php

namespace App\Http\Controllers;

use App\Models\PayrollRun;
use Illuminate\Http\Request;

class PayrollRunController extends Controller
{
    public function index(Request $request)
    {
        $query = PayrollRun::query()->with(['branch']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
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
            'period_start' => 'required|date',
            'period_end' => 'required|date|after:period_start',
            'status' => 'nullable|string|max:20',
        ]);

        $payroll = PayrollRun::create($validated);
        return response()->json($payroll, 201);
    }

    public function show(PayrollRun $payrollRun)
    {
        return $payrollRun->load([
            'branch',
            'items' => function ($query) {
                $query->with(['employee']);
            }
        ]);
    }

    public function update(Request $request, PayrollRun $payrollRun)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
        ]);

        $payrollRun->update($validated);
        return $payrollRun;
    }

    public function destroy(PayrollRun $payrollRun)
    {
        if ($payrollRun->status === 'processed') {
            return response()->json([
                'message' => 'Cannot delete processed payroll'
            ], 422);
        }

        $payrollRun->delete();
        return response()->noContent();
    }

    public function process(PayrollRun $payrollRun)
    {
        $payrollRun->update([
            'status' => 'processed',
            'processed_at' => now(),
        ]);
        return $payrollRun;
    }

    public function getByBranch($branchId)
    {
        $payrolls = PayrollRun::where('branch_id', $branchId)
            ->with(['items'])
            ->latest()
            ->get();
        return $payrolls;
    }

    public function getPending()
    {
        $payrolls = PayrollRun::where('status', 'pending')
            ->with(['branch'])
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
            'total_payroll_cost' => PayrollRun::with(['items'])->get()->sum(function ($payroll) {
                return $payroll->items->sum('net_pay');
            }),
        ];
        return $summary;
    }
}