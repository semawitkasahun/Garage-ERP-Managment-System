<?php

namespace App\Http\Controllers;

use App\Models\PayrollItem;
use App\Models\PayrollAllowance;
use App\Models\PayrollDeduction;
use Illuminate\Http\Request;

class PayrollItemController extends Controller
{
    public function index(Request $request)
    {
        $query = PayrollItem::query()->with(['payrollRun', 'employee', 'salaryStructure']);

        if ($request->has('payroll_run_id')) {
            $query->where('payroll_run_id', $request->payroll_run_id);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('payroll_period_id')) {
            $query->where('payroll_period_id', $request->payroll_period_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'payroll_run_id' => 'required|integer|exists:payroll_runs,payroll_run_id',
            'payroll_period_id' => 'nullable|integer|exists:payroll_periods,payroll_period_id',
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'salary_structure_id' => 'nullable|integer|exists:salary_structures,salary_structure_id',
            'basic_salary' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'net_pay' => 'nullable|numeric|min:0',
            'working_days' => 'nullable|integer|min:0',
            'days_present' => 'nullable|integer|min:0',
            'paid_leave_days' => 'nullable|integer|min:0',
            'unpaid_leave_days' => 'nullable|integer|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'total_allowances' => 'nullable|numeric|min:0',
            'gross_salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
        ]);

        $validated['status'] = $validated['status'] ?? 'pending';
        
        $item = PayrollItem::create($validated);
        return response()->json($item->load(['payrollRun', 'employee', 'salaryStructure']), 201);
    }

    public function show(PayrollItem $payrollItem)
    {
        return $payrollItem->load([
            'payrollRun',
            'employee',
            'salaryStructure',
            'payrollAllowances.allowance',
            'payrollDeductions.deduction'
        ]);
    }

    public function update(Request $request, PayrollItem $payrollItem)
    {
        $validated = $request->validate([
            'basic_salary' => 'nullable|numeric|min:0',
            'overtime_pay' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'net_pay' => 'nullable|numeric|min:0',
            'working_days' => 'nullable|integer|min:0',
            'days_present' => 'nullable|integer|min:0',
            'paid_leave_days' => 'nullable|integer|min:0',
            'unpaid_leave_days' => 'nullable|integer|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'total_allowances' => 'nullable|numeric|min:0',
            'gross_salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:30',
        ]);

        // Prevent editing if payroll run is approved or paid
        if (in_array($payrollItem->payrollRun->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Cannot edit payroll item from approved or paid payroll run'
            ], 422);
        }

        $payrollItem->update($validated);
        return $payrollItem->load(['payrollRun', 'employee', 'salaryStructure']);
    }

    public function destroy(PayrollItem $payrollItem)
    {
        // Prevent deletion if payroll run is approved or paid
        if (in_array($payrollItem->payrollRun->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Cannot delete payroll item from approved or paid payroll run'
            ], 422);
        }

        $payrollItem->delete();
        return response()->noContent();
    }

    public function addAllowance(Request $request, PayrollItem $payrollItem)
    {
        $validated = $request->validate([
            'allowance_id' => 'required|integer|exists:allowances,allowance_id',
            'amount' => 'required|numeric|min:0',
            'is_taxable' => 'nullable|boolean',
            'notes' => 'nullable|string',
        ]);

        $validated['is_taxable'] = $validated['is_taxable'] ?? true;
        
        $allowance = $payrollItem->payrollAllowances()->create($validated);
        
        // Recalculate total allowances
        $payrollItem->update([
            'total_allowances' => $payrollItem->payrollAllowances()->sum('amount'),
            'gross_salary' => $payrollItem->basic_salary + $payrollItem->payrollAllowances()->sum('amount') + $payrollItem->overtime_pay,
        ]);

        return response()->json($allowance->load(['allowance']), 201);
    }

    public function addDeduction(Request $request, PayrollItem $payrollItem)
    {
        $validated = $request->validate([
            'deduction_id' => 'required|integer|exists:deductions,deduction_id',
            'amount' => 'required|numeric|min:0',
            'deduction_type' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $deduction = $payrollItem->payrollDeductions()->create($validated);
        
        // Recalculate net pay
        $totalDeductions = $payrollItem->payrollDeductions()->sum('amount');
        $payrollItem->update([
            'deductions' => $totalDeductions,
            'net_pay' => $payrollItem->gross_salary - $totalDeductions,
        ]);

        return response()->json($deduction->load(['deduction']), 201);
    }

    public function removeAllowance(PayrollItem $payrollItem, $allowanceId)
    {
        $allowance = $payrollItem->payrollAllowances()->findOrFail($allowanceId);
        $allowance->delete();
        
        // Recalculate total allowances
        $payrollItem->update([
            'total_allowances' => $payrollItem->payrollAllowances()->sum('amount'),
            'gross_salary' => $payrollItem->basic_salary + $payrollItem->payrollAllowances()->sum('amount') + $payrollItem->overtime_pay,
        ]);

        return response()->noContent();
    }

    public function removeDeduction(PayrollItem $payrollItem, $deductionId)
    {
        $deduction = $payrollItem->payrollDeductions()->findOrFail($deductionId);
        $deduction->delete();
        
        // Recalculate net pay
        $totalDeductions = $payrollItem->payrollDeductions()->sum('amount');
        $payrollItem->update([
            'deductions' => $totalDeductions,
            'net_pay' => $payrollItem->gross_salary - $totalDeductions,
        ]);

        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'payroll_run_id' => 'required|integer|exists:payroll_runs,payroll_run_id',
            'payroll_period_id' => 'nullable|integer|exists:payroll_periods,payroll_period_id',
            'items' => 'required|array',
            'items.*.employee_id' => 'required|integer|exists:employees,employee_id',
            'items.*.basic_salary' => 'nullable|numeric|min:0',
            'items.*.overtime_pay' => 'nullable|numeric|min:0',
            'items.*.deductions' => 'nullable|numeric|min:0',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['payroll_run_id'] = $validated['payroll_run_id'];
            $itemData['payroll_period_id'] = $validated['payroll_period_id'] ?? null;
            $itemData['net_pay'] = ($itemData['basic_salary'] + ($itemData['overtime_pay'] ?? 0)) - ($itemData['deductions'] ?? 0);
            $itemData['status'] = 'pending';
            $createdItems[] = PayrollItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getByPayrollRun($payrollRunId)
    {
        $items = PayrollItem::where('payroll_run_id', $payrollRunId)
            ->with(['employee', 'salaryStructure', 'payrollAllowances.allowance', 'payrollDeductions.deduction'])
            ->get();
        return $items;
    }

    public function getByEmployee($employeeId)
    {
        $items = PayrollItem::where('employee_id', $employeeId)
            ->with(['payrollRun', 'payrollPeriod', 'salaryStructure'])
            ->latest()
            ->get();
        return $items;
    }

    public function getSummary($payrollRunId)
    {
        $items = PayrollItem::where('payroll_run_id', $payrollRunId);

        $summary = [
            'total_employees' => $items->count(),
            'total_basic_salary' => $items->sum('basic_salary'),
            'total_overtime_pay' => $items->sum('overtime_pay'),
            'total_allowances' => $items->sum('total_allowances'),
            'total_gross_salary' => $items->sum('gross_salary'),
            'total_deductions' => $items->sum('deductions'),
            'total_net_pay' => $items->sum('net_pay'),
            'total_working_days' => $items->sum('working_days'),
            'total_days_present' => $items->sum('days_present'),
            'total_overtime_hours' => $items->sum('overtime_hours'),
        ];

        return $summary;
    }

    public function generatePayslip(PayrollItem $payrollItem)
    {
        // Generate payslip data
        $payslipData = [
            'payslip_id' => 'PSL-' . str_pad($payrollItem->payroll_item_id, 6, '0', STR_PAD_LEFT),
            'employee' => $payrollItem->employee,
            'payroll_period' => $payrollItem->payrollPeriod,
            'earnings' => [
                'basic_salary' => $payrollItem->basic_salary,
                'overtime_pay' => $payrollItem->overtime_pay,
                'allowances' => $payrollItem->total_allowances,
                'gross_salary' => $payrollItem->gross_salary,
            ],
            'deductions' => [
                'total_deductions' => $payrollItem->deductions,
                'breakdown' => $payrollItem->payrollDeductions->map(function ($deduction) {
                    return [
                        'name' => $deduction->deduction->name,
                        'type' => $deduction->deduction->deduction_type,
                        'amount' => $deduction->amount,
                    ];
                }),
            ],
            'net_salary' => $payrollItem->net_pay,
            'working_days' => $payrollItem->working_days,
            'days_present' => $payrollItem->days_present,
            'paid_leave_days' => $payrollItem->paid_leave_days,
            'unpaid_leave_days' => $payrollItem->unpaid_leave_days,
            'overtime_hours' => $payrollItem->overtime_hours,
            'generated_at' => now(),
        ];

        return response()->json($payslipData);
    }

    public function downloadPayslip(PayrollItem $payrollItem)
    {
        // For now, return the payslip data as JSON
        // In a real implementation, this would generate a PDF
        $payslipData = [
            'payslip_id' => 'PSL-' . str_pad($payrollItem->payroll_item_id, 6, '0', STR_PAD_LEFT),
            'employee' => $payrollItem->employee,
            'payroll_period' => $payrollItem->payrollPeriod,
            'earnings' => [
                'basic_salary' => $payrollItem->basic_salary,
                'overtime_pay' => $payrollItem->overtime_pay,
                'allowances' => $payrollItem->total_allowances,
                'gross_salary' => $payrollItem->gross_salary,
            ],
            'deductions' => [
                'total_deductions' => $payrollItem->deductions,
                'breakdown' => $payrollItem->payrollDeductions->map(function ($deduction) {
                    return [
                        'name' => $deduction->deduction->name,
                        'type' => $deduction->deduction->deduction_type,
                        'amount' => $deduction->amount,
                    ];
                }),
            ],
            'net_salary' => $payrollItem->net_pay,
            'generated_at' => now(),
        ];

        return response()->json($payslipData);
    }
}