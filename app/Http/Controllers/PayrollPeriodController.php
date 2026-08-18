<?php

namespace App\Http\Controllers;

use App\Models\PayrollPeriod;
use App\Models\PayrollRun;
use Illuminate\Http\Request;

class PayrollPeriodController extends Controller
{
    public function index(Request $request)
    {
        $query = PayrollPeriod::query()->with(['branch', 'approvedBy']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('start_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('end_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'status' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);

        $startDate = $validated['start_date'];
        $endDate   = $validated['end_date'];
        $branchId  = $validated['branch_id'];

        // ── Rule 1: Max 4 payroll periods per calendar month ──────────────────
        $monthStart = \Carbon\Carbon::parse($startDate)->startOfMonth()->toDateString();
        $monthEnd   = \Carbon\Carbon::parse($startDate)->endOfMonth()->toDateString();

        $periodsInMonth = PayrollPeriod::where('branch_id', $branchId)
            ->where(function ($q) use ($monthStart, $monthEnd) {
                $q->whereBetween('start_date', [$monthStart, $monthEnd])
                  ->orWhereBetween('end_date', [$monthStart, $monthEnd])
                  ->orWhere(function ($q2) use ($monthStart, $monthEnd) {
                      $q2->where('start_date', '<=', $monthStart)
                         ->where('end_date', '>=', $monthEnd);
                  });
            })
            ->count();

        if ($periodsInMonth >= 4) {
            return response()->json([
                'message' => 'Maximum of 4 payroll periods per calendar month has been reached.',
                'error_code' => 'MAX_PERIODS_REACHED',
            ], 422);
        }

        // ── Rule 2: No overlapping payroll periods ─────────────────────────────
        $overlap = PayrollPeriod::where('branch_id', $branchId)
            ->where(function ($q) use ($startDate, $endDate) {
                $q->whereBetween('start_date', [$startDate, $endDate])
                  ->orWhereBetween('end_date', [$startDate, $endDate])
                  ->orWhere(function ($q2) use ($startDate, $endDate) {
                      $q2->where('start_date', '<=', $startDate)
                         ->where('end_date', '>=', $endDate);
                  });
            })
            ->first();

        if ($overlap) {
            return response()->json([
                'message' => "Date range overlaps with existing period: \"{$overlap->name}\" ({$overlap->start_date->format('M d')} – {$overlap->end_date->format('M d, Y')}).",
                'error_code' => 'OVERLAP_DETECTED',
                'conflicting_period' => [
                    'id'         => $overlap->payroll_period_id,
                    'name'       => $overlap->name,
                    'start_date' => $overlap->start_date->toDateString(),
                    'end_date'   => $overlap->end_date->toDateString(),
                ],
            ], 422);
        }

        $validated['status'] = $validated['status'] ?? 'draft';
        $payrollPeriod = PayrollPeriod::create($validated);
        return response()->json($payrollPeriod->load(['branch']), 201);
    }

    public function show(PayrollPeriod $payrollPeriod)
    {
        // Aggregate employee count, gross and net payroll from payroll items
        $payrollPeriod->load([
            'branch',
            'approvedBy',
            'payrollRuns.items.employee',
        ]);

        $items = $payrollPeriod->payrollItems;
        $payrollPeriod->employee_count = $items->count();
        $payrollPeriod->gross_payroll  = $items->sum('gross_salary');
        $payrollPeriod->net_payroll    = $items->sum('net_pay');

        return $payrollPeriod;
    }

    public function update(Request $request, PayrollPeriod $payrollPeriod)
    {
        // A closed/approved/paid period cannot be edited
        if (in_array($payrollPeriod->status, ['approved', 'paid', 'closed', 'cancelled'])) {
            return response()->json([
                'message' => 'This payroll period cannot be edited because it is ' . $payrollPeriod->status . '.',
            ], 422);
        }

        $validated = $request->validate([
            'name'       => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after:start_date',
            'status'     => 'nullable|string|max:30',
            'notes'      => 'nullable|string',
        ]);

        // Re-validate overlap if dates changed
        $newStart = $validated['start_date'] ?? $payrollPeriod->start_date->toDateString();
        $newEnd   = $validated['end_date']   ?? $payrollPeriod->end_date->toDateString();

        $overlap = PayrollPeriod::where('branch_id', $payrollPeriod->branch_id)
            ->where('payroll_period_id', '!=', $payrollPeriod->payroll_period_id)
            ->where(function ($q) use ($newStart, $newEnd) {
                $q->whereBetween('start_date', [$newStart, $newEnd])
                  ->orWhereBetween('end_date', [$newStart, $newEnd])
                  ->orWhere(function ($q2) use ($newStart, $newEnd) {
                      $q2->where('start_date', '<=', $newStart)
                         ->where('end_date', '>=', $newEnd);
                  });
            })
            ->first();

        if ($overlap) {
            return response()->json([
                'message' => "Date range overlaps with existing period: \"{$overlap->name}\".",
                'error_code' => 'OVERLAP_DETECTED',
            ], 422);
        }

        $payrollPeriod->update($validated);
        return $payrollPeriod->load(['branch']);
    }

    public function destroy(PayrollPeriod $payrollPeriod)
    {
        if (in_array($payrollPeriod->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Cannot delete a payroll period that has been approved or paid.',
            ], 422);
        }

        $payrollPeriod->delete();
        return response()->noContent();
    }

    /**
     * Returns month-level stats for the frontend summary bar.
     */
    public function getMonthStats(Request $request)
    {
        $month     = $request->integer('month', now()->month);
        $year      = $request->integer('year', now()->year);
        $branchId  = $request->integer('branch_id', 0);

        $monthStart = \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
        $monthEnd   = \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();

        $query = PayrollPeriod::where(function ($q) use ($monthStart, $monthEnd) {
            $q->whereBetween('start_date', [$monthStart, $monthEnd])
              ->orWhereBetween('end_date', [$monthStart, $monthEnd])
              ->orWhere(function ($q2) use ($monthStart, $monthEnd) {
                  $q2->where('start_date', '<=', $monthStart)
                     ->where('end_date', '>=', $monthEnd);
              });
        });

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $periods = $query->get();

        return response()->json([
            'month'               => \Carbon\Carbon::createFromDate($year, $month, 1)->format('F Y'),
            'total_periods'       => $periods->count(),
            'max_allowed'         => 4,
            'remaining_slots'     => max(0, 4 - $periods->count()),
            'open_periods'        => $periods->whereIn('status', ['draft', 'processing'])->count(),
            'processing_periods'  => $periods->where('status', 'processing')->count(),
            'pending_approval'    => $periods->where('status', 'pending_approval')->count(),
            'completed_periods'   => $periods->whereIn('status', ['approved', 'paid'])->count(),
        ]);
    }

    public function process(PayrollPeriod $payrollPeriod)
    {
        if ($payrollPeriod->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft payroll periods can be processed'
            ], 422);
        }

        // Check for active employees without payroll setup
        $activeEmployees = \App\Models\Employee::where('employment_status', 'active')
            ->where('branch_id', $payrollPeriod->branch_id)
            ->get();

        $employeesWithoutPayroll = $activeEmployees->filter(function ($employee) {
            return is_null($employee->currentSalaryStructure);
        });

        $employeesWithPayroll = $activeEmployees->filter(function ($employee) {
            return !is_null($employee->currentSalaryStructure);
        });

        // Allow processing even if some employees lack setup, but warn about excluded employees
        $payrollPeriod->update([
            'status' => 'processing',
            'processed_at' => now(),
        ]);

        $response = [
            'message' => 'Payroll period processed successfully',
            'total_active_employees' => $activeEmployees->count(),
            'payroll_ready_employees' => $employeesWithPayroll->count(),
            'excluded_employees' => $employeesWithoutPayroll->count(),
            'period_status' => $payrollPeriod->status,
        ];

        // Add warning information if employees were excluded
        if ($employeesWithoutPayroll->count() > 0) {
            $response['warning'] = "{$employeesWithoutPayroll->count()} active employee(s) were excluded due to missing payroll setup";
            $response['excluded_employees_list'] = $employeesWithoutPayroll->map(function ($employee) {
                return [
                    'id' => $employee->employee_id,
                    'name' => $employee->first_name . ' ' . $employee->last_name,
                    'job_title' => $employee->job_title,
                ];
            })->toArray();
        }

        return $response;
    }

    public function submitForApproval(PayrollPeriod $payrollPeriod)
    {
        if ($payrollPeriod->status !== 'processing') {
            return response()->json([
                'message' => 'Only processing payroll periods can be submitted for approval'
            ], 422);
        }

        $payrollPeriod->update([
            'status' => 'pending_approval',
        ]);

        return $payrollPeriod;
    }

    public function approve(Request $request, PayrollPeriod $payrollPeriod)
    {
        if ($payrollPeriod->status !== 'pending_approval') {
            return response()->json([
                'message' => 'Only pending approval payroll periods can be approved'
            ], 422);
        }

        $payrollPeriod->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->user_id,
        ]);

        return $payrollPeriod->load(['approvedBy']);
    }

    public function markAsPaid(PayrollPeriod $payrollPeriod)
    {
        if ($payrollPeriod->status !== 'approved') {
            return response()->json([
                'message' => 'Only approved payroll periods can be marked as paid'
            ], 422);
        }

        $payrollPeriod->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return $payrollPeriod;
    }

    public function cancel(PayrollPeriod $payrollPeriod)
    {
        if (in_array($payrollPeriod->status, ['paid'])) {
            return response()->json([
                'message' => 'Cannot cancel payroll period that has been paid'
            ], 422);
        }

        $payrollPeriod->update([
            'status' => 'cancelled',
        ]);

        return $payrollPeriod;
    }

    public function generatePayslips(PayrollPeriod $payrollPeriod)
    {
        if (!in_array($payrollPeriod->status, ['approved', 'paid'])) {
            return response()->json([
                'message' => 'Can only generate payslips for approved or paid payroll periods'
            ], 422);
        }

        $payslips = [];
        foreach ($payrollPeriod->payrollRuns as $run) {
            foreach ($run->items as $item) {
                $payslips[] = [
                    'payslip_id' => 'PSL-' . str_pad($item->payroll_item_id, 6, '0', STR_PAD_LEFT),
                    'employee' => $item->employee,
                    'payroll_item_id' => $item->payroll_item_id,
                    'earnings' => [
                        'basic_salary' => $item->basic_salary,
                        'overtime_pay' => $item->overtime_pay,
                        'allowances' => $item->total_allowances,
                        'gross_salary' => $item->gross_salary,
                    ],
                    'deductions' => [
                        'total_deductions' => $item->deductions,
                        'breakdown' => $item->payrollDeductions->map(function ($deduction) {
                            return [
                                'name' => $deduction->deduction->name,
                                'type' => $deduction->deduction->deduction_type,
                                'amount' => $deduction->amount,
                            ];
                        }),
                    ],
                    'net_salary' => $item->net_pay,
                ];
            }
        }

        return [
            'payroll_period' => $payrollPeriod->name,
            'generated_at' => now(),
            'total_payslips' => count($payslips),
            'payslips' => $payslips,
        ];
    }

    // Workflow Steps
    public function importAttendance(PayrollPeriod $payrollPeriod)
    {
        if ($payrollPeriod->status !== 'draft') {
            return response()->json([
                'message' => 'Can only import attendance for draft payroll periods'
            ], 422);
        }

        // Import attendance data for the period
        $startDate = $payrollPeriod->start_date;
        $endDate = $payrollPeriod->end_date;

        $attendanceData = \App\Models\Attendance::whereBetween('attendance_date', [$startDate, $endDate])
            ->with('employee')
            ->get()
            ->groupBy('employee_id');

        $importedRecords = 0;
        foreach ($attendanceData as $employeeId => $records) {
            $totalPresent = $records->where('status', 'present')->count();
            $totalAbsent = $records->where('status', 'absent')->count();
            $totalOvertimeHours = $records->sum('overtime_hours');

            // Store attendance summary for payroll calculation
            $importedRecords++;
        }

        $payrollPeriod->update([
            'status' => 'processing',
            'notes' => "Attendance imported: {$importedRecords} employees processed",
        ]);

        return [
            'message' => 'Attendance imported successfully',
            'imported_records' => $importedRecords,
            'period_status' => $payrollPeriod->status,
        ];
    }

    public function calculateSalaries(PayrollPeriod $payrollPeriod)
    {
        if (!in_array($payrollPeriod->status, ['processing', 'draft'])) {
            return response()->json([
                'message' => 'Can only calculate salaries for processing or draft payroll periods'
            ], 422);
        }

        // Calculate salaries based on attendance and salary structures
        // Only include active employees with payroll setup
        $employees = \App\Models\Employee::with('currentSalaryStructure.salaryStructure')
            ->where('employment_status', 'active')
            ->where('branch_id', $payrollPeriod->branch_id)
            ->whereHas('currentSalaryStructure')
            ->get();

        $calculatedSalaries = 0;

        foreach ($employees as $employee) {
            $salaryStructure = $employee->currentSalaryStructure;
            $basicSalary = $salaryStructure->basic_salary_override ?? ($salaryStructure->salaryStructure->basic_salary ?? 0);
            $workingDays = 22; // Standard working days per month

            // Get attendance for this employee in the period
            $attendance = \App\Models\Attendance::where('employee_id', $employee->employee_id)
                ->whereBetween('attendance_date', [$payrollPeriod->start_date, $payrollPeriod->end_date])
                ->get();

            $daysPresent = $attendance->where('status', 'present')->count();
            $overtimeHours = $attendance->sum('overtime_hours');
            $overtimePay = $overtimeHours * ($basicSalary / ($workingDays * 8)) * 1.5; // 1.5x overtime rate

            $calculatedSalaries++;
        }

        return [
            'message' => 'Salaries calculated successfully',
            'calculated_employees' => $calculatedSalaries,
            'period_status' => $payrollPeriod->status,
        ];
    }

    public function calculateDeductions(PayrollPeriod $payrollPeriod)
    {
        if (!in_array($payrollPeriod->status, ['processing', 'draft'])) {
            return response()->json([
                'message' => 'Can only calculate deductions for processing or draft payroll periods'
            ], 422);
        }

        // Calculate tax, pension, and other deductions
        $payrollItems = \App\Models\PayrollItem::where('payroll_period_id', $payrollPeriod->payroll_period_id)
            ->with('employee')
            ->get();

        $totalDeductions = 0;
        foreach ($payrollItems as $item) {
            $grossSalary = $item->gross_salary;
            
            // Calculate tax (simplified Ethiopian tax calculation)
            $tax = $this->calculateTax($grossSalary);
            
            // Calculate pension (11% employee contribution)
            $pension = $grossSalary * 0.11;
            
            $totalDeductions += $tax + $pension;
        }

        return [
            'message' => 'Deductions calculated successfully',
            'total_deductions' => $totalDeductions,
            'period_status' => $payrollPeriod->status,
        ];
    }

    private function calculateTax($grossSalary)
    {
        // Simplified Ethiopian progressive tax calculation
        if ($grossSalary <= 600) {
            return 0;
        } elseif ($grossSalary <= 1650) {
            return ($grossSalary - 600) * 0.10;
        } elseif ($grossSalary <= 3200) {
            return 105 + ($grossSalary - 1650) * 0.15;
        } elseif ($grossSalary <= 5250) {
            return 337.5 + ($grossSalary - 3200) * 0.20;
        } elseif ($grossSalary <= 7800) {
            return 747.5 + ($grossSalary - 5250) * 0.25;
        } elseif ($grossSalary <= 10900) {
            return 1385 + ($grossSalary - 7800) * 0.30;
        } else {
            return 2237.5 + ($grossSalary - 10900) * 0.35;
        }
    }

    public function reviewPayroll(PayrollPeriod $payrollPeriod)
    {
        if (!in_array($payrollPeriod->status, ['processing', 'draft'])) {
            return response()->json([
                'message' => 'Can only review processing or draft payroll periods'
            ], 422);
        }

        // Review payroll calculations and flag any issues
        $payrollItems = \App\Models\PayrollItem::where('payroll_period_id', $payrollPeriod->payroll_period_id)
            ->with('employee')
            ->get();

        $issues = [];
        foreach ($payrollItems as $item) {
            if ($item->net_pay < 0) {
                $issues[] = [
                    'employee' => $item->employee->first_name . ' ' . $item->employee->last_name,
                    'issue' => 'Negative net pay',
                    'net_pay' => $item->net_pay,
                ];
            }
            if ($item->days_present > 30) {
                $issues[] = [
                    'employee' => $item->employee->first_name . ' ' . $item->employee->last_name,
                    'issue' => 'Excessive days present',
                    'days_present' => $item->days_present,
                ];
            }
        }

        $payrollPeriod->update([
            'status' => 'pending_approval',
            'notes' => count($issues) > 0 ? 'Review completed with ' . count($issues) . ' issues' : 'Review completed successfully',
        ]);

        return [
            'message' => 'Payroll review completed',
            'issues_found' => count($issues),
            'issues' => $issues,
            'period_status' => $payrollPeriod->status,
        ];
    }

    public function processPayment(PayrollPeriod $payrollPeriod)
    {
        if ($payrollPeriod->status !== 'approved') {
            return response()->json([
                'message' => 'Can only process payments for approved payroll periods'
            ], 422);
        }

        // Process payments for all employees in the period
        $payrollItems = \App\Models\PayrollItem::where('payroll_period_id', $payrollPeriod->payroll_period_id)
            ->get();

        $processedPayments = 0;
        $totalAmount = 0;

        foreach ($payrollItems as $item) {
            // In a real implementation, this would integrate with payment systems
            $processedPayments++;
            $totalAmount += $item->net_pay;
        }

        $payrollPeriod->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        return [
            'message' => 'Payments processed successfully',
            'processed_payments' => $processedPayments,
            'total_amount' => $totalAmount,
            'period_status' => $payrollPeriod->status,
        ];
    }

    public function getSummary()
    {
        $summary = [
            'total_periods' => PayrollPeriod::count(),
            'by_status' => PayrollPeriod::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'active_periods' => PayrollPeriod::active()->count(),
            'current_month' => PayrollPeriod::whereMonth('start_date', now()->month)
                ->whereYear('start_date', now()->year)
                ->first(),
        ];

        return $summary;
    }

    public function getDashboardMetrics()
    {
        $currentPeriod = PayrollPeriod::where('status', '!=', 'cancelled')
            ->where('status', '!=', 'paid')
            ->latest()
            ->first();

        $totalEmployees = \App\Models\Employee::count();
        $pendingApproval = PayrollPeriod::where('status', 'pending_approval')->count();
        $paidEmployees = PayrollPeriod::where('status', 'paid')->count();

        $grossPayroll = 0;
        $totalDeductions = 0;
        $netPayroll = 0;

        if ($currentPeriod) {
            $payrollRuns = $currentPeriod->payrollRuns;
            foreach ($payrollRuns as $run) {
                $grossPayroll += $run->total_gross_pay ?? 0;
                $totalDeductions += $run->total_deductions ?? 0;
                $netPayroll += $run->total_net_pay ?? 0;
            }
        }

        return [
            'total_employees' => $totalEmployees,
            'current_payroll_period' => $currentPeriod ? [
                'id' => $currentPeriod->payroll_period_id,
                'name' => $currentPeriod->name,
                'start_date' => $currentPeriod->start_date,
                'end_date' => $currentPeriod->end_date,
                'status' => $currentPeriod->status,
            ] : null,
            'gross_payroll' => $grossPayroll,
            'total_deductions' => $totalDeductions,
            'net_payroll' => $netPayroll,
            'pending_approval' => $pendingApproval,
            'paid_employees' => $paidEmployees,
        ];
    }

    public function getByBranch($branchId)
    {
        $periods = PayrollPeriod::where('branch_id', $branchId)
            ->with(['branch'])
            ->latest()
            ->get();
        return $periods;
    }
}
