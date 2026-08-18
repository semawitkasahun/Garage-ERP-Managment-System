<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use App\Models\PayrollRun;
use App\Models\PayrollItem;
use App\Models\Employee;
use Illuminate\Http\Request;

class PayrollReportController extends Controller
{
    public function getSummaryReport(Request $request)
    {
        $query = PayrollPeriod::query();

        if ($request->has('start_date')) {
            $query->whereDate('start_date', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('end_date', '<=', $request->end_date);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $periods = $query->with(['payrollRuns'])->get();

        $totalGrossPay = 0;
        $totalDeductions = 0;
        $totalNetPay = 0;
        $totalEmployees = 0;

        foreach ($periods as $period) {
            foreach ($period->payrollRuns as $run) {
                $totalGrossPay += $run->total_gross_pay ?? 0;
                $totalDeductions += $run->total_deductions ?? 0;
                $totalNetPay += $run->total_net_pay ?? 0;
                $totalEmployees += $run->total_employees ?? 0;
            }
        }

        return [
            'total_periods' => $periods->count(),
            'total_employees' => $totalEmployees,
            'total_gross_pay' => $totalGrossPay,
            'total_deductions' => $totalDeductions,
            'total_net_pay' => $totalNetPay,
            'average_salary' => $totalEmployees > 0 ? $totalNetPay / $totalEmployees : 0,
            'periods' => $periods,
        ];
    }

    public function getEmployeeCostAnalysis(Request $request)
    {
        $query = PayrollItem::query()->with(['employee', 'payrollPeriod']);

        if ($request->has('start_date')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                $q->whereDate('start_date', '>=', $request->start_date);
            });
        }

        if ($request->has('end_date')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                $q->whereDate('end_date', '<=', $request->end_date);
            });
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        $items = $query->get();

        $employeeBreakdown = [];
        foreach ($items as $item) {
            $employeeId = $item->employee_id;
            if (!isset($employeeBreakdown[$employeeId])) {
                $employeeBreakdown[$employeeId] = [
                    'employee' => $item->employee,
                    'total_gross_pay' => 0,
                    'total_deductions' => 0,
                    'total_net_pay' => 0,
                    'total_overtime' => 0,
                    'total_allowances' => 0,
                    'period_count' => 0,
                ];
            }

            $employeeBreakdown[$employeeId]['total_gross_pay'] += $item->gross_salary;
            $employeeBreakdown[$employeeId]['total_deductions'] += $item->deductions;
            $employeeBreakdown[$employeeId]['total_net_pay'] += $item->net_pay;
            $employeeBreakdown[$employeeId]['total_overtime'] += $item->overtime_pay;
            $employeeBreakdown[$employeeId]['total_allowances'] += $item->total_allowances;
            $employeeBreakdown[$employeeId]['period_count']++;
        }

        return [
            'employee_breakdown' => array_values($employeeBreakdown),
            'total_employees' => count($employeeBreakdown),
            'report_period' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
        ];
    }

    public function getPeriodComparison(Request $request)
    {
        if (!$request->has('period1_id') || !$request->has('period2_id')) {
            return response()->json(['message' => 'Both period IDs are required'], 422);
        }

        $period1 = PayrollPeriod::with(['payrollRuns'])->find($request->period1_id);
        $period2 = PayrollPeriod::with(['payrollRuns'])->find($request->period2_id);

        if (!$period1 || !$period2) {
            return response()->json(['message' => 'One or both periods not found'], 404);
        }

        $getPeriodTotals = function ($period) {
            $totals = [
                'gross_pay' => 0,
                'deductions' => 0,
                'net_pay' => 0,
                'employees' => 0,
            ];

            foreach ($period->payrollRuns as $run) {
                $totals['gross_pay'] += $run->total_gross_pay ?? 0;
                $totals['deductions'] += $run->total_deductions ?? 0;
                $totals['net_pay'] += $run->total_net_pay ?? 0;
                $totals['employees'] += $run->total_employees ?? 0;
            }

            return $totals;
        };

        $period1Totals = $getPeriodTotals($period1);
        $period2Totals = $getPeriodTotals($period2);

        return [
            'period1' => [
                'id' => $period1->payroll_period_id,
                'name' => $period1->name,
                'start_date' => $period1->start_date,
                'end_date' => $period1->end_date,
                'totals' => $period1Totals,
            ],
            'period2' => [
                'id' => $period2->payroll_period_id,
                'name' => $period2->name,
                'start_date' => $period2->start_date,
                'end_date' => $period2->end_date,
                'totals' => $period2Totals,
            ],
            'comparison' => [
                'gross_pay_change' => $period2Totals['gross_pay'] - $period1Totals['gross_pay'],
                'gross_pay_percent_change' => $period1Totals['gross_pay'] > 0 
                    ? (($period2Totals['gross_pay'] - $period1Totals['gross_pay']) / $period1Totals['gross_pay']) * 100 
                    : 0,
                'net_pay_change' => $period2Totals['net_pay'] - $period1Totals['net_pay'],
                'net_pay_percent_change' => $period1Totals['net_pay'] > 0 
                    ? (($period2Totals['net_pay'] - $period1Totals['net_pay']) / $period1Totals['net_pay']) * 100 
                    : 0,
                'employee_count_change' => $period2Totals['employees'] - $period1Totals['employees'],
            ],
        ];
    }

    public function getDepartmentReport(Request $request)
    {
        if (!$request->has('department_id')) {
            return response()->json(['message' => 'Department ID is required'], 422);
        }

        $query = PayrollItem::query()->with(['employee.department', 'payrollPeriod']);

        $query->whereHas('employee', function ($q) use ($request) {
            $q->where('department_id', $request->department_id);
        });

        if ($request->has('start_date')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                $q->whereDate('start_date', '>=', $request->start_date);
            });
        }

        if ($request->has('end_date')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                $q->whereDate('end_date', '<=', $request->end_date);
            });
        }

        $items = $query->get();

        $departmentTotals = [
            'total_gross_pay' => 0,
            'total_deductions' => 0,
            'total_net_pay' => 0,
            'employee_count' => 0,
            'period_count' => 0,
        ];

        $employeeBreakdown = [];
        foreach ($items as $item) {
            $departmentTotals['total_gross_pay'] += $item->gross_salary;
            $departmentTotals['total_deductions'] += $item->deductions;
            $departmentTotals['total_net_pay'] += $item->net_pay;

            $employeeId = $item->employee_id;
            if (!isset($employeeBreakdown[$employeeId])) {
                $employeeBreakdown[$employeeId] = [
                    'employee' => $item->employee,
                    'total_gross_pay' => 0,
                    'total_net_pay' => 0,
                ];
                $departmentTotals['employee_count']++;
            }

            $employeeBreakdown[$employeeId]['total_gross_pay'] += $item->gross_salary;
            $employeeBreakdown[$employeeId]['total_net_pay'] += $item->net_pay;
        }

        // Count unique periods
        $periodIds = $items->pluck('payroll_period_id')->unique();
        $departmentTotals['period_count'] = $periodIds->count();

        return [
            'department_id' => $request->department_id,
            'totals' => $departmentTotals,
            'employee_breakdown' => array_values($employeeBreakdown),
            'report_period' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
        ];
    }

    public function getDeductionAnalysis(Request $request)
    {
        $query = PayrollItem::query()->with(['payrollDeductions.deduction', 'payrollPeriod']);

        if ($request->has('start_date')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                $q->whereDate('start_date', '>=', $request->start_date);
            });
        }

        if ($request->has('end_date')) {
            $query->whereHas('payrollPeriod', function ($q) use ($request) {
                $q->whereDate('end_date', '<=', $request->end_date);
            });
        }

        if ($request->has('deduction_type')) {
            $query->whereHas('payrollDeductions.deduction', function ($q) use ($request) {
                $q->where('deduction_type', $request->deduction_type);
            });
        }

        $items = $query->get();

        $deductionBreakdown = [];
        $totalDeductions = 0;

        foreach ($items as $item) {
            foreach ($item->payrollDeductions as $payrollDeduction) {
                $deductionType = $payrollDeduction->deduction->deduction_type ?? 'other';
                $deductionName = $payrollDeduction->deduction->name ?? 'Other';

                if (!isset($deductionBreakdown[$deductionType])) {
                    $deductionBreakdown[$deductionType] = [
                        'type' => $deductionType,
                        'name' => $deductionName,
                        'total_amount' => 0,
                        'count' => 0,
                    ];
                }

                $deductionBreakdown[$deductionType]['total_amount'] += $payrollDeduction->amount;
                $deductionBreakdown[$deductionType]['count']++;
                $totalDeductions += $payrollDeduction->amount;
            }
        }

        return [
            'total_deductions' => $totalDeductions,
            'deduction_breakdown' => array_values($deductionBreakdown),
            'report_period' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
            ],
        ];
    }

    public function getPaymentHistory(Request $request)
    {
        $statusFilter = $request->input('status', 'all');

        $paymentQuery = \App\Models\PayrollPayment::query()
            ->with([
                'employee.department',
                'payrollPeriod',
                'payrollItem.payrollAllowances.allowance',
                'payrollItem.payrollDeductions.deduction',
                'processedBy',
            ]);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $paymentQuery->where(function ($q) use ($search) {
                $q->whereHas('employee', function ($eq) use ($search) {
                    $eq->where('first_name', 'like', "%{$search}%")
                       ->orWhere('last_name', 'like', "%{$search}%")
                       ->orWhere('job_title', 'like', "%{$search}%");
                })
                ->orWhere('payment_reference', 'like', "%{$search}%")
                ->orWhere('receipt_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('payroll_period_id') && $request->payroll_period_id !== 'all') {
            $paymentQuery->where('payroll_period_id', $request->payroll_period_id);
        }

        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $paymentQuery->where('payment_method', $request->payment_method);
        }

        if ($request->filled('start_date')) {
            $paymentQuery->whereDate('payment_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $paymentQuery->whereDate('payment_date', '<=', $request->end_date);
        }

        if ($statusFilter === 'paid') {
            $paymentQuery->where('status', 'paid');
        }

        $paidPayments = $paymentQuery->latest('payment_date')->latest('payroll_payment_id')->get();

        $pendingItems = collect();
        if ($statusFilter === 'all' || $statusFilter === 'pending') {
            $pendingQuery = PayrollItem::query()
                ->with(['employee.department', 'payrollPeriod'])
                ->where('status', 'approved')
                ->whereDoesntHave('payrollPayment');

            if ($request->filled('search')) {
                $search = $request->input('search');
                $pendingQuery->whereHas('employee', function ($eq) use ($search) {
                    $eq->where('first_name', 'like', "%{$search}%")
                       ->orWhere('last_name', 'like', "%{$search}%")
                       ->orWhere('job_title', 'like', "%{$search}%");
                });
            }

            if ($request->filled('payroll_period_id') && $request->payroll_period_id !== 'all') {
                $pendingQuery->where('payroll_period_id', $request->payroll_period_id);
            }

            $pendingItems = $pendingQuery->latest('approved_at')->get();
        }

        $now = now();
        $thisMonthPaid = \App\Models\PayrollPayment::where('status', 'paid')
            ->whereMonth('payment_date', $now->month)
            ->whereYear('payment_date', $now->year)
            ->sum('amount');

        $pendingPaymentsCount = PayrollItem::where('status', 'approved')
            ->whereDoesntHave('payrollPayment')
            ->count();

        $formatPaymentReference = function ($paymentId, $reference, $receiptNumber, $paymentDate) {
            if ($reference) {
                return $reference;
            }
            if ($receiptNumber) {
                return $receiptNumber;
            }
            $year = $paymentDate ? $paymentDate->format('Y') : now()->format('Y');
            return 'PAY-' . $year . '-' . str_pad($paymentId, 4, '0', STR_PAD_LEFT);
        };

        $paidRecords = $paidPayments->map(function ($p) use ($formatPaymentReference) {
            $emp = $p->employee;
            $item = $p->payrollItem;
            $period = $p->payrollPeriod;

            return [
                'payroll_payment_id' => $p->payroll_payment_id,
                'payroll_item_id'    => $p->payroll_item_id,
                'employee_id'        => $p->employee_id,
                'employee_name'      => $emp ? trim($emp->first_name . ' ' . $emp->last_name) : 'Employee',
                'employee_code'      => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
                'job_title'          => $emp->job_title ?? 'Staff',
                'department'         => $emp->department->name ?? '-',
                'period_id'          => $period->payroll_period_id ?? null,
                'period_name'        => $period->name ?? 'Payroll Period',
                'period_start'       => $period ? $period->start_date->format('Y-m-d') : null,
                'period_end'         => $period ? $period->end_date->format('Y-m-d') : null,
                'gross_salary'       => $item ? (float) $item->gross_salary : (float) $p->amount,
                'total_deductions'   => $item ? (float) $item->deductions : 0,
                'net_salary'         => (float) $p->amount,
                'payment_method'     => $p->payment_method,
                'payment_date'       => $p->payment_date ? $p->payment_date->format('Y-m-d') : null,
                'payment_reference'  => $formatPaymentReference(
                    $p->payroll_payment_id,
                    $p->payment_reference,
                    $p->receipt_number,
                    $p->payment_date
                ),
                'receipt_number'     => $p->receipt_number,
                'notes'              => $p->notes,
                'status'             => $p->status ?? 'paid',
                'processed_by'       => $p->processedBy->username ?? '-',
            ];
        });

        $pendingRecords = $pendingItems->map(function ($item) {
            $emp = $item->employee;
            $period = $item->payrollPeriod;

            return [
                'payroll_payment_id' => null,
                'payroll_item_id'    => $item->payroll_item_id,
                'employee_id'        => $item->employee_id,
                'employee_name'      => $emp ? trim($emp->first_name . ' ' . $emp->last_name) : 'Employee',
                'employee_code'      => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
                'job_title'          => $emp->job_title ?? 'Staff',
                'department'         => $emp->department->name ?? '-',
                'period_id'          => $period->payroll_period_id ?? null,
                'period_name'        => $period->name ?? 'Payroll Period',
                'period_start'       => $period ? $period->start_date->format('Y-m-d') : null,
                'period_end'         => $period ? $period->end_date->format('Y-m-d') : null,
                'gross_salary'       => (float) $item->gross_salary,
                'total_deductions'   => (float) $item->deductions,
                'net_salary'         => (float) $item->net_pay,
                'payment_method'     => null,
                'payment_date'       => null,
                'payment_reference'  => null,
                'receipt_number'     => null,
                'notes'              => null,
                'status'             => 'pending',
                'processed_by'       => null,
            ];
        });

        if ($statusFilter === 'pending') {
            $data = $pendingRecords->values();
        } elseif ($statusFilter === 'paid') {
            $data = $paidRecords->values();
        } else {
            $data = $paidRecords->concat($pendingRecords)->sortByDesc(function ($row) {
                return $row['payment_date'] ?? $row['period_end'] ?? '';
            })->values();
        }

        $totalAmountPaid = $paidRecords->where('status', 'paid')->sum('net_salary');

        return response()->json([
            'summary' => [
                'total_payments'    => $paidRecords->count(),
                'total_amount_paid' => round($totalAmountPaid, 2),
                'this_month_paid'   => round($thisMonthPaid, 2),
                'pending_payments'  => $pendingPaymentsCount,
            ],
            'payments' => $data,
        ]);
    }

    public function getPaymentRecord(Request $request, $id)
    {
        $type = $request->input('type', 'paid');

        if ($type === 'pending') {
            $item = PayrollItem::query()
                ->with(['employee.department', 'payrollPeriod'])
                ->where('payroll_item_id', $id)
                ->where('status', 'approved')
                ->whereDoesntHave('payrollPayment')
                ->first();

            if (!$item) {
                return response()->json(['message' => 'Pending payroll record not found'], 404);
            }

            return response()->json(['payment' => $this->transformPendingItem($item)]);
        }

        $payment = \App\Models\PayrollPayment::query()
            ->with([
                'employee.department',
                'payrollPeriod',
                'payrollItem',
                'processedBy',
            ])
            ->find($id);

        if (!$payment) {
            return response()->json(['message' => 'Payment record not found'], 404);
        }

        return response()->json(['payment' => $this->transformPaymentRecord($payment)]);
    }

    private function formatPaymentReferenceValue($paymentId, $reference, $receiptNumber, $paymentDate): string
    {
        if ($reference) {
            return $reference;
        }
        if ($receiptNumber) {
            return $receiptNumber;
        }
        $year = $paymentDate ? $paymentDate->format('Y') : now()->format('Y');
        return 'PAY-' . $year . '-' . str_pad($paymentId, 4, '0', STR_PAD_LEFT);
    }

    private function transformPaymentRecord($p): array
    {
        $emp = $p->employee;
        $item = $p->payrollItem;
        $period = $p->payrollPeriod;

        return [
            'payroll_payment_id' => $p->payroll_payment_id,
            'payroll_item_id'    => $p->payroll_item_id,
            'employee_id'        => $p->employee_id,
            'employee_name'      => $emp ? trim($emp->first_name . ' ' . $emp->last_name) : 'Employee',
            'employee_code'      => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
            'job_title'          => $emp->job_title ?? 'Staff',
            'department'         => $emp->department->name ?? '-',
            'period_id'          => $period->payroll_period_id ?? null,
            'period_name'        => $period->name ?? 'Payroll Period',
            'period_start'       => $period ? $period->start_date->format('Y-m-d') : null,
            'period_end'         => $period ? $period->end_date->format('Y-m-d') : null,
            'gross_salary'       => $item ? (float) $item->gross_salary : (float) $p->amount,
            'total_deductions'   => $item ? (float) $item->deductions : 0,
            'net_salary'         => (float) $p->amount,
            'payment_method'     => $p->payment_method,
            'payment_date'       => $p->payment_date ? $p->payment_date->format('Y-m-d') : null,
            'payment_reference'  => $this->formatPaymentReferenceValue(
                $p->payroll_payment_id,
                $p->payment_reference,
                $p->receipt_number,
                $p->payment_date
            ),
            'receipt_number'     => $p->receipt_number,
            'notes'              => $p->notes,
            'status'             => $p->status ?? 'paid',
            'processed_by'       => $p->processedBy->username ?? '-',
        ];
    }

    private function transformPendingItem($item): array
    {
        $emp = $item->employee;
        $period = $item->payrollPeriod;

        return [
            'payroll_payment_id' => null,
            'payroll_item_id'    => $item->payroll_item_id,
            'employee_id'        => $item->employee_id,
            'employee_name'      => $emp ? trim($emp->first_name . ' ' . $emp->last_name) : 'Employee',
            'employee_code'      => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
            'job_title'          => $emp->job_title ?? 'Staff',
            'department'         => $emp->department->name ?? '-',
            'period_id'          => $period->payroll_period_id ?? null,
            'period_name'        => $period->name ?? 'Payroll Period',
            'period_start'       => $period ? $period->start_date->format('Y-m-d') : null,
            'period_end'         => $period ? $period->end_date->format('Y-m-d') : null,
            'gross_salary'       => (float) $item->gross_salary,
            'total_deductions'   => (float) $item->deductions,
            'net_salary'         => (float) $item->net_pay,
            'payment_method'     => null,
            'payment_date'       => null,
            'payment_reference'  => null,
            'receipt_number'     => null,
            'notes'              => null,
            'status'             => 'pending',
            'processed_by'       => null,
        ];
    }

    /**
     * Master endpoint for Payroll Reports section
     */
    public function getComprehensiveReport(Request $request)
    {
        $periodQuery = PayrollPeriod::query();

        if ($request->filled('payroll_period_id') && $request->payroll_period_id !== 'all') {
            $periodQuery->where('payroll_period_id', $request->payroll_period_id);
        }
        if ($request->filled('year')) {
            $periodQuery->whereYear('start_date', $request->year);
        }
        if ($request->filled('month')) {
            $periodQuery->whereMonth('start_date', $request->month);
        }

        $periods = $periodQuery->get();
        $periodIds = $periods->pluck('payroll_period_id')->filter()->toArray();

        // Query payroll items with relationships
        $itemQuery = PayrollItem::query()
            ->with([
                'employee.department',
                'payrollPeriod',
                'payrollAllowances.allowance',
                'payrollDeductions.deduction',
                'payrollPayment.processedBy',
            ]);

        if (!empty($periodIds)) {
            $itemQuery->whereIn('payroll_period_id', $periodIds);
        }

        if ($request->filled('employee_id') && $request->employee_id !== 'all') {
            $itemQuery->where('employee_id', $request->employee_id);
        }

        if ($request->filled('department_id') && $request->department_id !== 'all') {
            $itemQuery->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->department_id);
            });
        }

        if ($request->filled('job_title') && $request->job_title !== 'all') {
            $itemQuery->whereHas('employee', function ($q) use ($request) {
                $q->where('job_title', $request->job_title);
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'paid') {
                $itemQuery->where('status', 'paid');
            } elseif ($request->status === 'pending') {
                $itemQuery->whereIn('status', ['draft', 'pending', 'calculated', 'under_review', 'pending_approval', 'approved']);
            } else {
                $itemQuery->where('status', $request->status);
            }
        }

        $items = $itemQuery->get();

        // 6 Summary Card metrics
        $totalEmployeesCount = $items->pluck('employee_id')->unique()->count();
        if ($totalEmployeesCount === 0) {
            $totalEmployeesCount = Employee::where('employment_status', 'active')->count();
        }

        $grossPayroll   = round($items->sum('gross_salary'), 2);
        $totalDeductions = round($items->sum('deductions'), 2);
        $netPayroll      = round($items->sum('net_pay'), 2);
        $totalPaid       = round($items->where('status', 'paid')->sum('net_pay'), 2);
        $pendingPayments = round($netPayroll - $totalPaid, 2);

        $summary = [
            'total_employees'  => $totalEmployeesCount,
            'gross_payroll'    => $grossPayroll,
            'total_deductions' => $totalDeductions,
            'net_payroll'      => $netPayroll,
            'total_paid'       => $totalPaid,
            'pending_payments' => max(0, $pendingPayments),
        ];

        // 1. Payroll Summary (Period-based breakdown)
        $summaryReport = $periods->map(function ($period) use ($items) {
            $pItems = $items->where('payroll_period_id', $period->payroll_period_id);
            $gross  = $pItems->sum('gross_salary');
            $ded    = $pItems->sum('deductions');
            $net    = $pItems->sum('net_pay');
            $paid   = $pItems->where('status', 'paid')->sum('net_pay');

            return [
                'period_id'     => $period->payroll_period_id,
                'period_name'   => $period->name,
                'start_date'    => $period->start_date->format('Y-m-d'),
                'end_date'      => $period->end_date->format('Y-m-d'),
                'employee_count'=> $pItems->pluck('employee_id')->unique()->count(),
                'gross_salary'  => round($gross, 2),
                'total_deductions' => round($ded, 2),
                'net_salary'    => round($net, 2),
                'amount_paid'   => round($paid, 2),
                'amount_pending'=> round(max(0, $net - $paid), 2),
                'status'        => $period->status,
            ];
        });

        // 2. Employee Payroll Report
        $employeeReport = $items->map(function ($item) {
            $emp = $item->employee;
            return [
                'employee_id'   => $item->employee_id,
                'employee_name' => $emp ? ($emp->first_name . ' ' . $emp->last_name) : 'Employee',
                'employee_code' => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
                'job_title'     => $emp->job_title ?? 'Staff',
                'department'    => $emp->department->name ?? '-',
                'basic_salary'  => round($item->basic_salary, 2),
                'allowances'    => round($item->total_allowances, 2),
                'gross_salary'  => round($item->gross_salary, 2),
                'deductions'    => round($item->deductions, 2),
                'net_salary'    => round($item->net_pay, 2),
                'payment_status'=> $item->status,
            ];
        });

        // 3. Deduction Report
        $deductionReport = $items->map(function ($item) {
            $emp = $item->employee;
            $taxAmount = round($item->tax_amount, 2);
            $pensionAmount = round($item->pension_amount, 2);
            $otherDeductions = round(max(0, $item->deductions - $taxAmount - $pensionAmount), 2);

            return [
                'employee_id'    => $item->employee_id,
                'employee_name'  => $emp ? ($emp->first_name . ' ' . $emp->last_name) : 'Employee',
                'employee_code'  => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
                'gross_salary'   => round($item->gross_salary, 2),
                'tax'            => $taxAmount,
                'pension'        => $pensionAmount,
                'other_deductions'=> $otherDeductions,
                'total_deductions'=> round($item->deductions, 2),
            ];
        });

        // 4. Payment Report
        $paymentReport = $items->map(function ($item) {
            $emp = $item->employee;
            $pmt = $item->payrollPayment;
            $period = $item->payrollPeriod;

            return [
                'employee_id'       => $item->employee_id,
                'employee_name'     => $emp ? ($emp->first_name . ' ' . $emp->last_name) : 'Employee',
                'employee_code'     => $emp ? ('EMP-' . str_pad($emp->employee_id, 3, '0', STR_PAD_LEFT)) : '-',
                'period_name'       => $period->name ?? 'Period',
                'net_salary'        => round($item->net_pay, 2),
                'payment_method'    => $pmt->payment_method ?? '—',
                'payment_date'      => $pmt && $pmt->payment_date ? $pmt->payment_date->format('Y-m-d') : '—',
                'payment_reference' => $pmt->payment_reference ?? $pmt->receipt_number ?? '—',
                'status'            => $item->status,
            ];
        });

        // 5. Payroll Period Report
        $periodReport = $summaryReport;

        return response()->json([
            'summary'          => $summary,
            'payroll_summary'  => $summaryReport,
            'employee_report'  => $employeeReport,
            'deduction_report' => $deductionReport,
            'payment_report'   => $paymentReport,
            'period_report'    => $periodReport,
        ]);
    }
}