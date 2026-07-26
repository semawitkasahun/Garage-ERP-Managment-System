<?php

namespace App\Http\Controllers;

use App\Models\PayrollItem;
use Illuminate\Http\Request;

class PayrollItemController extends Controller
{
    public function index(Request $request)
    {
        $query = PayrollItem::query()->with(['payrollRun', 'employee']);

        if ($request->has('payroll_run_id')) {
            $query->where('payroll_run_id', $request->payroll_run_id);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'payroll_run_id' => 'required|integer|exists:payroll_runs,payroll_run_id',
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'base_pay' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'net_pay' => 'nullable|numeric|min:0',
        ]);

        // Calculate net pay if not provided
        if (!isset($validated['net_pay']) && isset($validated['base_pay'])) {
            $validated['net_pay'] = ($validated['base_pay'] + ($validated['overtime_pay'] ?? 0)) - ($validated['deductions'] ?? 0);
        }

        $item = PayrollItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(PayrollItem $payrollItem)
    {
        return $payrollItem->load(['payrollRun', 'employee']);
    }

    public function update(Request $request, PayrollItem $payrollItem)
    {
        $validated = $request->validate([
            'base_pay' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'net_pay' => 'nullable|numeric|min:0',
        ]);

        // Recalculate net pay if not provided
        if (!isset($validated['net_pay']) && isset($validated['base_pay'])) {
            $validated['net_pay'] = ($validated['base_pay'] + ($validated['overtime_pay'] ?? 0)) - ($validated['deductions'] ?? 0);
        }

        $payrollItem->update($validated);
        return $payrollItem;
    }

    public function destroy(PayrollItem $payrollItem)
    {
        $payrollItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'payroll_run_id' => 'required|integer|exists:payroll_runs,payroll_run_id',
            'items' => 'required|array',
            'items.*.employee_id' => 'required|integer|exists:employees,employee_id',
            'items.*.base_pay' => 'nullable|numeric|min:0',
            'items.*.overtime_pay' => 'nullable|numeric|min:0',
            'items.*.deductions' => 'nullable|numeric|min:0',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['payroll_run_id'] = $validated['payroll_run_id'];
            $itemData['net_pay'] = ($itemData['base_pay'] + ($itemData['overtime_pay'] ?? 0)) - ($itemData['deductions'] ?? 0);
            $createdItems[] = PayrollItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getByPayrollRun($payrollRunId)
    {
        $items = PayrollItem::where('payroll_run_id', $payrollRunId)
            ->with(['employee'])
            ->get();
        return $items;
    }

    public function getByEmployee($employeeId)
    {
        $items = PayrollItem::where('employee_id', $employeeId)
            ->with(['payrollRun'])
            ->latest()
            ->get();
        return $items;
    }

    public function getSummary($payrollRunId)
    {
        $items = PayrollItem::where('payroll_run_id', $payrollRunId);

        $summary = [
            'total_employees' => $items->count(),
            'total_base_pay' => $items->sum('base_pay'),
            'total_overtime_pay' => $items->sum('overtime_pay'),
            'total_deductions' => $items->sum('deductions'),
            'total_net_pay' => $items->sum('net_pay'),
        ];

        return $summary;
    }
}