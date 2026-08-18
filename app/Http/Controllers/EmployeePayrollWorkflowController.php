<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\PayrollItem;
use App\Models\PayrollPeriod;
use App\Models\PayrollPayment;
use App\Models\PayrollAllowance;
use App\Models\PayrollDeduction;
use App\Models\Allowance;
use App\Models\Deduction;
use Illuminate\Http\Request;

class EmployeePayrollWorkflowController extends Controller
{
    /**
     * List all active employees with their payroll status for a given period
     */
    public function list(Request $request)
    {
        $periodId = $request->input('payroll_period_id');

        $query = Employee::query()
            ->with(['branch', 'department', 'currentSalaryStructure.salaryStructure'])
            ->where('employment_status', 'active');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('job_title', 'like', "%{$search}%");
            });
        }

        $employees = $query->latest()->paginate($request->integer('per_page', 20));

        // Attach payroll item data for the selected period
        $employees->getCollection()->transform(function ($employee) use ($periodId) {
            $payrollItem = null;
            $payrollPayment = null;

            if ($periodId) {
                $payrollItem = PayrollItem::where('employee_id', $employee->employee_id)
                    ->where('payroll_period_id', $periodId)
                    ->with(['payrollAllowances.allowance', 'payrollDeductions.deduction', 'payrollPayment'])
                    ->first();

                if ($payrollItem) {
                    $payrollPayment = $payrollItem->payrollPayment;
                }
            }

            $salaryStructure = $employee->currentSalaryStructure;

            return [
                'id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'job_title' => $employee->job_title,
                'status' => $employee->employment_status,
                'branch_id' => $employee->branch_id,
                'branch' => $employee->branch,
                'department_id' => $employee->department_id,
                'department' => $employee->department,
                'hire_date' => $employee->hire_date,
                'phone' => $employee->phone,
                'email' => $employee->email,
                'payroll_profile' => $salaryStructure ? [
                    'id' => $salaryStructure->employee_salary_structure_id,
                    'basic_salary' => $salaryStructure->basic_salary_override ?? ($salaryStructure->salaryStructure->basic_salary ?? null),
                    'salary_type' => $salaryStructure->salaryStructure->salary_type ?? 'monthly',
                    'payment_frequency' => $salaryStructure->salaryStructure->payment_frequency ?? 'monthly',
                    'overtime_rate' => $salaryStructure->overtime_rate_override ?? ($salaryStructure->salaryStructure->overtime_rate ?? null),
                    'effective_date' => $salaryStructure->effective_date,
                    'is_active' => $salaryStructure->is_active,
                    'salary_structure_name' => $salaryStructure->salaryStructure->name ?? null,
                ] : null,
                'payroll_item' => $payrollItem ? [
                    'payroll_item_id' => $payrollItem->payroll_item_id,
                    'basic_salary' => $payrollItem->basic_salary,
                    'overtime_pay' => $payrollItem->overtime_pay,
                    'total_allowances' => $payrollItem->total_allowances,
                    'gross_salary' => $payrollItem->gross_salary,
                    'deductions' => $payrollItem->deductions,
                    'net_pay' => $payrollItem->net_pay,
                    'status' => $payrollItem->status,
                ] : null,
                'payment' => $payrollPayment ? [
                    'payment_method' => $payrollPayment->payment_method,
                    'payment_date' => $payrollPayment->payment_date,
                    'receipt_number' => $payrollPayment->receipt_number,
                ] : null,
            ];
        });

        return $employees;
    }

    /**
     * Get full payroll detail for an employee in a given period
     */
    public function detail(Request $request, $employeeId)
    {
        $employee = Employee::with(['branch', 'department', 'currentSalaryStructure.salaryStructure'])
            ->findOrFail($employeeId);

        $periodId = $request->input('payroll_period_id');
        $period = $periodId ? PayrollPeriod::find($periodId) : null;

        $payrollItem = null;
        $attendanceData = null;
        $payrollPayment = null;

        if ($period) {
            $payrollItem = PayrollItem::where('employee_id', $employeeId)
                ->where('payroll_period_id', $periodId)
                ->with([
                    'payrollAllowances.allowance',
                    'payrollDeductions.deduction',
                    'payrollPayment.processedBy',
                    'salaryStructure',
                    'reviewedBy',
                    'approvedByUser',
                ])
                ->first();

            // Always fetch attendance data
            $attendanceData = $this->buildAttendanceData($employee, $period);

            if ($payrollItem) {
                $payrollPayment = $payrollItem->payrollPayment;
            }
        }

        $salaryStructure = $employee->currentSalaryStructure;

        return response()->json([
            'employee' => [
                'id' => $employee->employee_id,
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'job_title' => $employee->job_title,
                'status' => $employee->employment_status,
                'branch' => $employee->branch,
                'department' => $employee->department,
                'hire_date' => $employee->hire_date,
                'email' => $employee->email,
                'phone' => $employee->phone,
            ],
            'salary_info' => $salaryStructure ? [
                'basic_salary' => $salaryStructure->basic_salary_override ?? ($salaryStructure->salaryStructure->basic_salary ?? 0),
                'salary_type' => $salaryStructure->salaryStructure->salary_type ?? 'monthly',
                'payment_frequency' => $salaryStructure->salaryStructure->payment_frequency ?? 'monthly',
                'overtime_rate' => $salaryStructure->overtime_rate_override ?? ($salaryStructure->salaryStructure->overtime_rate ?? 0),
                'salary_structure_name' => $salaryStructure->salaryStructure->name ?? null,
                'working_days_per_month' => $salaryStructure->salaryStructure->working_days_per_month ?? 22,
                'working_hours_per_day' => $salaryStructure->salaryStructure->working_hours_per_day ?? 8,
            ] : null,
            'period' => $period,
            'attendance' => $attendanceData,
            'payroll_item' => $payrollItem,
            'payment' => $payrollPayment,
        ]);
    }

    /**
     * Step 1: Get attendance data for an employee in a period
     */
    public function attendance(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $employee = Employee::findOrFail($employeeId);
        $period = PayrollPeriod::findOrFail($request->payroll_period_id);

        $attendanceData = $this->buildAttendanceData($employee, $period);

        return response()->json($attendanceData);
    }

    /**
     * Step 2: Calculate salary for an employee
     */
    public function calculate(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $employee = Employee::with('currentSalaryStructure.salaryStructure')->findOrFail($employeeId);
        $period = PayrollPeriod::findOrFail($request->payroll_period_id);

        $salaryStructure = $employee->currentSalaryStructure;
        if (!$salaryStructure) {
            return response()->json([
                'message' => 'Employee does not have an active salary structure. Please configure payroll in Employee Management.',
            ], 422);
        }

        $basicSalary = $salaryStructure->basic_salary_override ?? ($salaryStructure->salaryStructure->basic_salary ?? 0);
        $overtimeRate = $salaryStructure->overtime_rate_override ?? ($salaryStructure->salaryStructure->overtime_rate ?? 0);
        $workingDaysPerMonth = $salaryStructure->salaryStructure->working_days_per_month ?? 22;
        $workingHoursPerDay = $salaryStructure->salaryStructure->working_hours_per_day ?? 8;

        // Get attendance
        $attendanceData = $this->buildAttendanceData($employee, $period);

        // Calculate overtime / part-time pay (1 hour = 100 Birr)
        $parttimeHourlyRate = $overtimeRate > 0 ? $overtimeRate : 100;
        $overtimePay = round($attendanceData['overtime_hours'] * $parttimeHourlyRate, 2);

        // Calculate unpaid leave deduction
        $dailyRate = $basicSalary / $workingDaysPerMonth;
        $attendanceDeduction = round($attendanceData['unpaid_leave_days'] * $dailyRate, 2);

        // Get applicable allowances
        $allowances = Allowance::where('is_active', true)
            ->where(function ($q) use ($employee) {
                $q->where('applies_to_all', true)
                    ->orWhereJsonContains('applicable_employee_ids', $employee->employee_id)
                    ->orWhereJsonContains('applicable_department_ids', $employee->department_id);
            })
            ->get();

        $totalAllowances = 0;
        $allowanceItems = [];
        foreach ($allowances as $allowance) {
            $amount = $allowance->calculation_type === 'percentage'
                ? round($basicSalary * ($allowance->percentage_value / 100), 2)
                : $allowance->amount;
            $totalAllowances += $amount;
            $allowanceItems[] = [
                'allowance_id' => $allowance->allowance_id,
                'name' => $allowance->name,
                'amount' => $amount,
                'is_taxable' => $allowance->is_taxable,
            ];
        }

        $grossSalary = round($basicSalary + $overtimePay + $totalAllowances - $attendanceDeduction, 2);

        // Find or create the payroll item
        $payrollItem = PayrollItem::firstOrNew([
            'employee_id' => $employee->employee_id,
            'payroll_period_id' => $period->payroll_period_id,
        ]);

        // If it's already under_review or beyond, don't allow recalculation
        if ($payrollItem->exists && !in_array($payrollItem->status, ['draft', 'pending', 'calculated'])) {
            return response()->json([
                'message' => 'Cannot recalculate: payroll is already at ' . $payrollItem->status . ' stage.',
            ], 422);
        }

        // Assign a payroll_run_id if needed (use existing or create logic)
        if (!$payrollItem->payroll_run_id) {
            $payrollRun = \App\Models\PayrollRun::firstOrCreate(
                [
                    'branch_id' => $employee->branch_id,
                    'period_start' => $period->start_date,
                    'period_end' => $period->end_date,
                ],
                [
                    'name' => $period->name,
                    'status' => 'processing',
                ]
            );
            $payrollItem->payroll_run_id = $payrollRun->payroll_run_id;
        }

        $payrollItem->fill([
            'basic_salary' => $basicSalary,
            'overtime_pay' => $overtimePay,
            'total_allowances' => $totalAllowances,
            'gross_salary' => $grossSalary,
            'working_days' => $attendanceData['working_days'],
            'days_present' => $attendanceData['present_days'],
            'absent_days' => $attendanceData['absent_days'],
            'late_days' => $attendanceData['late_days'],
            'leave_days' => $attendanceData['leave_days'],
            'paid_leave_days' => $attendanceData['paid_leave_days'],
            'unpaid_leave_days' => $attendanceData['unpaid_leave_days'],
            'overtime_hours' => $attendanceData['overtime_hours'],
            'attendance_deduction' => $attendanceDeduction,
            'bonuses' => 0,
            'salary_structure_id' => $salaryStructure->salaryStructure->salary_structure_id ?? null,
            'status' => 'calculated',
        ]);

        $payrollItem->save();

        // Sync allowances
        $payrollItem->payrollAllowances()->delete();
        foreach ($allowanceItems as $item) {
            PayrollAllowance::create([
                'payroll_item_id' => $payrollItem->payroll_item_id,
                'allowance_id' => $item['allowance_id'],
                'amount' => $item['amount'],
                'is_taxable' => $item['is_taxable'],
            ]);
        }

        return response()->json([
            'message' => 'Salary calculated successfully',
            'payroll_item' => $payrollItem->fresh()->load(['payrollAllowances.allowance']),
            'allowances' => $allowanceItems,
        ]);
    }

    /**
     * Step 3: Calculate deductions
     */
    public function calculateDeductions(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $payrollItem = PayrollItem::where('employee_id', $employeeId)
            ->where('payroll_period_id', $request->payroll_period_id)
            ->first();

        if (!$payrollItem) {
            return response()->json([
                'message' => 'Please calculate salary first before calculating deductions.',
            ], 422);
        }

        if (!in_array($payrollItem->status, ['calculated', 'draft', 'pending'])) {
            return response()->json([
                'message' => 'Cannot recalculate deductions: payroll is at ' . $payrollItem->status . ' stage.',
            ], 422);
        }

        $grossSalary = $payrollItem->gross_salary;

        // Calculate Ethiopian income tax
        $taxAmount = $this->calculateTax($grossSalary);

        // Calculate pension (7% employee contribution in Ethiopia)
        $pensionAmount = round($payrollItem->basic_salary * 0.07, 2);

        // Get other applicable deductions
        $employee = Employee::findOrFail($employeeId);
        $deductions = Deduction::where('is_active', true)
            ->whereNotIn('deduction_type', ['tax', 'pension'])
            ->where(function ($q) use ($employee) {
                $q->where('applies_to_all', true)
                    ->orWhereJsonContains('applicable_employee_ids', $employee->employee_id)
                    ->orWhereJsonContains('applicable_department_ids', $employee->department_id);
            })
            ->orderBy('priority', 'desc')
            ->get();

        $otherDeductions = 0;
        $deductionItems = [];

        foreach ($deductions as $deduction) {
            $amount = $deduction->calculation_type === 'percentage'
                ? round($grossSalary * ($deduction->percentage_value / 100), 2)
                : $deduction->amount;
            $otherDeductions += $amount;
            $deductionItems[] = [
                'deduction_id' => $deduction->deduction_id,
                'name' => $deduction->name,
                'type' => $deduction->deduction_type,
                'amount' => $amount,
            ];
        }

        // Attendance deduction is already factored into gross
        $totalDeductions = round($taxAmount + $pensionAmount + $otherDeductions, 2);
        $netPay = round($grossSalary - $totalDeductions, 2);

        // Sync deductions on the payroll item
        $payrollItem->payrollDeductions()->delete();

        // Create tax deduction record
        $taxDeduction = Deduction::where('deduction_type', 'tax')->first();
        if ($taxDeduction) {
            PayrollDeduction::create([
                'payroll_item_id' => $payrollItem->payroll_item_id,
                'deduction_id' => $taxDeduction->deduction_id,
                'amount' => $taxAmount,
                'deduction_type' => 'tax',
                'notes' => 'Ethiopian income tax',
            ]);
        }

        // Create pension deduction record
        $pensionDeduction = Deduction::where('deduction_type', 'pension')->first();
        if ($pensionDeduction) {
            PayrollDeduction::create([
                'payroll_item_id' => $payrollItem->payroll_item_id,
                'deduction_id' => $pensionDeduction->deduction_id,
                'amount' => $pensionAmount,
                'deduction_type' => 'pension',
                'notes' => 'Employee pension contribution (7%)',
            ]);
        }

        // Create other deduction records
        foreach ($deductionItems as $item) {
            PayrollDeduction::create([
                'payroll_item_id' => $payrollItem->payroll_item_id,
                'deduction_id' => $item['deduction_id'],
                'amount' => $item['amount'],
                'deduction_type' => $item['type'],
            ]);
        }

        $payrollItem->update([
            'tax_amount' => $taxAmount,
            'pension_amount' => $pensionAmount,
            'deductions' => $totalDeductions,
            'net_pay' => $netPay,
            'status' => 'calculated',
        ]);

        return response()->json([
            'message' => 'Deductions calculated successfully',
            'payroll_item' => $payrollItem->fresh()->load(['payrollDeductions.deduction']),
            'breakdown' => [
                'gross_salary' => $grossSalary,
                'tax' => $taxAmount,
                'pension' => $pensionAmount,
                'other_deductions' => $otherDeductions,
                'total_deductions' => $totalDeductions,
                'net_pay' => $netPay,
            ],
        ]);
    }

    /**
     * Step 4: Confirm review
     */
    public function confirmReview(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $payrollItem = PayrollItem::where('employee_id', $employeeId)
            ->where('payroll_period_id', $request->payroll_period_id)
            ->first();

        if (!$payrollItem) {
            return response()->json(['message' => 'Payroll has not been calculated yet.'], 422);
        }

        // Auto-calculate deductions if needed
        if (($payrollItem->getAttributes()['deductions'] ?? 0) <= 0 && $payrollItem->gross_salary > 0) {
            $taxAmount = $this->calculateTax($payrollItem->gross_salary);
            $pensionAmount = round($payrollItem->basic_salary * 0.07, 2);
            $totalDeductions = round($taxAmount + $pensionAmount, 2);
            $netPay = round($payrollItem->gross_salary - $totalDeductions, 2);

            $payrollItem->update([
                'tax_amount' => $taxAmount,
                'pension_amount' => $pensionAmount,
                'deductions' => $totalDeductions,
                'net_pay' => $netPay,
            ]);
        }

        $payrollItem->update([
            'status' => 'under_review',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()->user_id ?? null,
        ]);

        return response()->json([
            'message' => 'Payroll review confirmed',
            'payroll_item' => $payrollItem->fresh(),
        ]);
    }

    /**
     * Step 5: Approve payroll
     */
    public function approve(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $payrollItem = PayrollItem::where('employee_id', $employeeId)
            ->where('payroll_period_id', $request->payroll_period_id)
            ->first();

        if (!$payrollItem) {
            return response()->json(['message' => 'Payroll has not been calculated yet.'], 422);
        }

        if (!in_array($payrollItem->status, ['calculated', 'under_review'])) {
            return response()->json([
                'message' => 'Payroll cannot be approved in its current status: ' . $payrollItem->status,
            ], 422);
        }

        // Ensure deductions exist before approval
        if ($payrollItem->getAttributes()['deductions'] <= 0 && $payrollItem->gross_salary > 0) {
            $taxAmount = $this->calculateTax($payrollItem->gross_salary);
            $pensionAmount = round($payrollItem->basic_salary * 0.07, 2);
            $totalDeductions = round($taxAmount + $pensionAmount, 2);
            $netPay = round($payrollItem->gross_salary - $totalDeductions, 2);

            $payrollItem->update([
                'tax_amount' => $taxAmount,
                'pension_amount' => $pensionAmount,
                'deductions' => $totalDeductions,
                'net_pay' => $netPay,
            ]);
        }

        $payrollItem->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->user_id ?? null,
        ]);

        return response()->json([
            'message' => 'Payroll approved successfully',
            'payroll_item' => $payrollItem->fresh(),
        ]);
    }

    /**
     * Step 6: Process payment
     */
    public function pay(Request $request, $employeeId)
    {
        $validated = $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
            'payment_method' => 'required|string|in:bank_transfer,cash,other',
            'payment_date' => 'required|date',
            'payment_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $payrollItem = PayrollItem::where('employee_id', $employeeId)
            ->where('payroll_period_id', $validated['payroll_period_id'])
            ->first();

        if (!$payrollItem) {
            return response()->json(['message' => 'Payroll has not been calculated yet.'], 422);
        }

        if ($payrollItem->status !== 'approved') {
            return response()->json(['message' => 'Payroll must be approved before payment can be processed.'], 422);
        }

        // Check if already paid
        if ($payrollItem->payrollPayment) {
            return response()->json(['message' => 'Payment has already been processed for this payroll.'], 422);
        }

        $receiptNumber = PayrollPayment::generateReceiptNumber();

        $payment = PayrollPayment::create([
            'payroll_item_id' => $payrollItem->payroll_item_id,
            'employee_id' => $employeeId,
            'payroll_period_id' => $validated['payroll_period_id'],
            'amount' => $payrollItem->net_pay,
            'payment_method' => $validated['payment_method'],
            'payment_date' => $validated['payment_date'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'receipt_number' => $receiptNumber,
            'notes' => $validated['notes'] ?? null,
            'processed_by' => $request->user()->user_id ?? null,
            'status' => 'paid',
        ]);

        $payrollItem->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return response()->json([
            'message' => 'Payment processed successfully',
            'payment' => $payment->load(['processedBy']),
            'payroll_item' => $payrollItem->fresh(),
        ]);
    }

    /**
     * Step 7: Get payslip data
     */
    public function payslip(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $employee = Employee::with(['branch', 'department'])->findOrFail($employeeId);
        $period = PayrollPeriod::with('branch')->findOrFail($request->payroll_period_id);

        $payrollItem = PayrollItem::where('employee_id', $employeeId)
            ->where('payroll_period_id', $request->payroll_period_id)
            ->with(['payrollAllowances.allowance', 'payrollDeductions.deduction', 'payrollPayment.processedBy'])
            ->first();

        if (!$payrollItem || !in_array($payrollItem->status, ['paid'])) {
            return response()->json([
                'message' => 'Payslip is only available after payment has been processed.',
            ], 422);
        }

        $payment = $payrollItem->payrollPayment;

        return response()->json([
            'payslip_id' => 'PSL-' . str_pad($payrollItem->payroll_item_id, 6, '0', STR_PAD_LEFT),
            'company' => [
                'name' => $period->branch->name ?? 'Garage ERP',
                'address' => $period->branch->address ?? '',
                'phone' => $period->branch->phone ?? '',
                'email' => $period->branch->email ?? '',
            ],
            'employee' => [
                'id' => $employee->employee_id,
                'employee_code' => 'EMP-' . str_pad($employee->employee_id, 3, '0', STR_PAD_LEFT),
                'name' => $employee->first_name . ' ' . $employee->last_name,
                'job_title' => $employee->job_title,
                'department' => $employee->department->name ?? '-',
                'branch' => $employee->branch->name ?? '-',
            ],
            'period' => [
                'name' => $period->name,
                'start_date' => optional($period->start_date)->format('Y-m-d') ?? $period->start_date,
                'end_date' => optional($period->end_date)->format('Y-m-d') ?? $period->end_date,
            ],
            'attendance' => [
                'working_days' => $payrollItem->working_days,
                'days_present' => $payrollItem->days_present,
                'absent_days' => $payrollItem->absent_days,
                'leave_days' => $payrollItem->leave_days,
                'late_days' => $payrollItem->late_days,
                'overtime_hours' => $payrollItem->overtime_hours,
            ],
            'earnings' => [
                'basic_salary' => $payrollItem->basic_salary,
                'overtime_pay' => $payrollItem->overtime_pay,
                'allowances' => $payrollItem->payrollAllowances->map(fn($a) => [
                    'name' => $a->allowance->name ?? 'Allowance',
                    'amount' => $a->amount,
                ]),
                'bonuses' => $payrollItem->bonuses,
                'gross_salary' => $payrollItem->gross_salary,
            ],
            'deductions' => [
                'items' => $payrollItem->payrollDeductions->map(fn($d) => [
                    'name' => $d->deduction->name ?? 'Deduction',
                    'type' => $d->deduction_type,
                    'amount' => $d->amount,
                ]),
                'tax' => $payrollItem->tax_amount,
                'pension' => $payrollItem->pension_amount,
                'attendance_deduction' => $payrollItem->attendance_deduction,
                'total_deductions' => $payrollItem->deductions,
            ],
            'net_salary' => $payrollItem->net_pay,
            'payment' => $payment ? [
                'date' => optional($payment->payment_date)->format('Y-m-d') ?? $payment->payment_date,
                'method' => $payment->payment_method,
                'reference' => $payment->payment_reference,
                'processed_by' => $payment->processedBy->username ?? '-',
            ] : null,
            'status' => $payrollItem->status,
            'generated_at' => now()->toISOString(),
        ]);
    }

    /**
     * Step 8: Get payment receipt data
     */
    public function receipt(Request $request, $employeeId)
    {
        $request->validate([
            'payroll_period_id' => 'required|integer|exists:payroll_periods,payroll_period_id',
        ]);

        $employee = Employee::with(['branch'])->findOrFail($employeeId);
        $period = PayrollPeriod::with('branch')->findOrFail($request->payroll_period_id);

        $payrollItem = PayrollItem::where('employee_id', $employeeId)
            ->where('payroll_period_id', $request->payroll_period_id)
            ->with(['payrollPayment.processedBy'])
            ->first();

        if (!$payrollItem || !$payrollItem->payrollPayment) {
            return response()->json([
                'message' => 'Receipt is only available after payment has been processed.',
            ], 422);
        }

        $payment = $payrollItem->payrollPayment;

        return response()->json([
            'company' => [
                'name' => $period->branch->name ?? 'Garage ERP',
                'address' => $period->branch->address ?? '',
                'phone' => $period->branch->phone ?? '',
                'email' => $period->branch->email ?? '',
            ],
            'receipt_number' => $payment->receipt_number,
            'employee' => [
                'id' => $employee->employee_id,
                'employee_code' => 'EMP-' . str_pad($employee->employee_id, 3, '0', STR_PAD_LEFT),
                'name' => $employee->first_name . ' ' . $employee->last_name,
            ],
            'payroll_period' => $period->name,
            'period_dates' => (optional($period->start_date)->format('Y-m-d') ?? $period->start_date)
                . ' — ' . (optional($period->end_date)->format('Y-m-d') ?? $period->end_date),
            'amount_paid' => $payment->amount,
            'payment_method' => $payment->payment_method,
            'payment_date' => optional($payment->payment_date)->format('Y-m-d') ?? $payment->payment_date,
            'payment_reference' => $payment->payment_reference,
            'processed_by' => $payment->processedBy->username ?? '-',
            'status' => 'PAID',
            'generated_at' => now()->toISOString(),
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function buildAttendanceData(Employee $employee, PayrollPeriod $period)
    {
        $startDate = $period->start_date;
        $endDate = $period->end_date;

        // Total working days in the period (excluding weekends)
        $totalWorkingDays = 0;
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            if (!$current->isWeekend()) {
                $totalWorkingDays++;
            }
            $current->addDay();
        }

        // Get attendance records
        $attendance = Attendance::where('employee_id', $employee->employee_id)
            ->whereBetween('attendance_date', [$startDate, $endDate])
            ->get();

        $presentDays = $attendance->where('status', 'present')->count();
        $absentDays = $attendance->where('status', 'absent')->count();
        $lateDays = $attendance->where('late_minutes', '>', 0)->count();
        $totalOvertimeHours = (float) $attendance->sum('overtime_hours');

        // Get approved leave requests in the period
        $leaveRequests = LeaveRequest::where('employee_id', $employee->employee_id)
            ->where('status', 'approved')
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                    ->orWhereBetween('end_date', [$startDate, $endDate])
                    ->orWhere(function ($q2) use ($startDate, $endDate) {
                        $q2->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                    });
            })
            ->get();

        $totalLeaveDays = 0;
        $paidLeaveDays = 0;
        $unpaidLeaveDays = 0;

        foreach ($leaveRequests as $leave) {
            $leaveStart = max($leave->start_date, $startDate);
            $leaveEnd = min($leave->end_date, $endDate);
            $days = \Carbon\Carbon::parse($leaveStart)->diffInDays(\Carbon\Carbon::parse($leaveEnd)) + 1;
            $totalLeaveDays += $days;

            if (in_array($leave->leave_type, ['unpaid', 'unpaid_leave'])) {
                $unpaidLeaveDays += $days;
            } else {
                $paidLeaveDays += $days;
            }
        }

        return [
            'working_days' => $totalWorkingDays,
            'present_days' => $presentDays,
            'absent_days' => $absentDays,
            'leave_days' => $totalLeaveDays,
            'paid_leave_days' => $paidLeaveDays,
            'unpaid_leave_days' => $unpaidLeaveDays,
            'late_days' => $lateDays,
            'overtime_hours' => $totalOvertimeHours,
            'attendance_records' => $attendance->map(fn($a) => [
                'date' => $a->attendance_date->format('Y-m-d'),
                'status' => $a->status,
                'clock_in' => $a->clock_in ? $a->clock_in->format('H:i') : null,
                'clock_out' => $a->clock_out ? $a->clock_out->format('H:i') : null,
                'late_minutes' => $a->late_minutes,
                'overtime_hours' => $a->overtime_hours,
                'total_worked_hours' => $a->total_worked_hours,
            ]),
        ];
    }

    private function calculateTax($grossSalary)
    {
        // Ethiopian progressive income tax brackets
        if ($grossSalary <= 600) {
            return 0;
        } elseif ($grossSalary <= 1650) {
            return round(($grossSalary - 600) * 0.10, 2);
        } elseif ($grossSalary <= 3200) {
            return round(105 + ($grossSalary - 1650) * 0.15, 2);
        } elseif ($grossSalary <= 5250) {
            return round(337.5 + ($grossSalary - 3200) * 0.20, 2);
        } elseif ($grossSalary <= 7800) {
            return round(747.5 + ($grossSalary - 5250) * 0.25, 2);
        } elseif ($grossSalary <= 10900) {
            return round(1385 + ($grossSalary - 7800) * 0.30, 2);
        } else {
            return round(2315 + ($grossSalary - 10900) * 0.35, 2);
        }
    }
}
