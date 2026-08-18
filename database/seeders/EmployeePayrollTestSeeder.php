<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Employee;
use App\Models\SalaryStructure;
use App\Models\EmployeeSalaryStructure;
use App\Models\PayrollPeriod;
use App\Models\Attendance;
use Carbon\Carbon;

class EmployeePayrollTestSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Get or create primary branch
        $branch = Branch::firstOrCreate(
            ['branch_id' => 1],
            [
                'name' => 'Main Garage Branch',
                'address' => 'Bole Road, Addis Ababa',
                'phone' => '+251 91 123 4567',
                'email' => 'info@garageerp.et',
                'is_active' => true,
            ]
        );

        // 2. Get or create department
        $department = Department::firstOrCreate(
            ['name' => 'Technical & Maintenance'],
            [
                'branch_id' => $branch->branch_id,
                'description' => 'Automotive repair and technical service department',
            ]
        );

        // 3. Get or create salary structure (100 ETB/hr overtime)
        $salaryStructure = SalaryStructure::firstOrCreate(
            ['code' => 'TECH-STD-01'],
            [
                'branch_id' => $branch->branch_id,
                'department_id' => $department->department_id,
                'name' => 'Technician Monthly Salary Structure',
                'basic_salary' => 25000.00,
                'salary_type' => 'monthly',
                'payment_frequency' => 'monthly',
                'overtime_rate' => 100.00, // 1 hour = 100 Birr
                'working_days_per_month' => 22,
                'working_hours_per_day' => 8,
                'is_active' => true,
            ]
        );

        // 4. Create or update August 2026 Payroll Period
        $period = PayrollPeriod::firstOrCreate(
            [
                'start_date' => '2026-08-01',
                'end_date' => '2026-08-31',
            ],
            [
                'branch_id' => $branch->branch_id,
                'name' => 'August 2026 Payroll',
                'status' => 'processing',
            ]
        );

        // 5. Create Employee 1: Nati (Good Attendance)
        $nati = Employee::firstOrCreate(
            ['first_name' => 'Nati', 'last_name' => 'Tekle'],
            [
                'branch_id' => $branch->branch_id,
                'department_id' => $department->department_id,
                'job_title' => 'Technician',
                'hire_date' => '2025-01-15',
                'phone' => '+251911000001',
                'email' => 'nati@garageerp.et',
                'employment_status' => 'active',
            ]
        );
        // Assign salary structure for Nati
        EmployeeSalaryStructure::updateOrCreate(
            ['employee_id' => $nati->employee_id, 'is_active' => true],
            [
                'salary_structure_id' => $salaryStructure->salary_structure_id,
                'basic_salary_override' => 25000.00,
                'overtime_rate_override' => 100.00,
                'effective_date' => '2026-01-01',
            ]
        );

        // 6. Create Employee 2: Abebe (Good Attendance)
        $abebe = Employee::firstOrCreate(
            ['first_name' => 'Abebe', 'last_name' => 'Molla'],
            [
                'branch_id' => $branch->branch_id,
                'department_id' => $department->department_id,
                'job_title' => 'Senior Technician',
                'hire_date' => '2024-06-01',
                'phone' => '+251911000002',
                'email' => 'abebe@garageerp.et',
                'employment_status' => 'active',
            ]
        );
        EmployeeSalaryStructure::updateOrCreate(
            ['employee_id' => $abebe->employee_id, 'is_active' => true],
            [
                'salary_structure_id' => $salaryStructure->salary_structure_id,
                'basic_salary_override' => 30000.00,
                'overtime_rate_override' => 100.00,
                'effective_date' => '2026-01-01',
            ]
        );

        // 7. Create Employee 3: Kebede (Bad Attendance)
        $kebede = Employee::firstOrCreate(
            ['first_name' => 'Kebede', 'last_name' => 'Tadesse'],
            [
                'branch_id' => $branch->branch_id,
                'department_id' => $department->department_id,
                'job_title' => 'Assistant Technician',
                'hire_date' => '2026-03-10',
                'phone' => '+251911000003',
                'email' => 'kebede@garageerp.et',
                'employment_status' => 'active',
            ]
        );
        EmployeeSalaryStructure::updateOrCreate(
            ['employee_id' => $kebede->employee_id, 'is_active' => true],
            [
                'salary_structure_id' => $salaryStructure->salary_structure_id,
                'basic_salary_override' => 18000.00,
                'overtime_rate_override' => 100.00,
                'effective_date' => '2026-01-01',
            ]
        );

        // 8. Seed Attendance Records for August 2026
        $start = Carbon::parse('2026-08-01');
        $end = Carbon::parse('2026-08-31');

        $workingDayCount = 0;
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            if ($date->isWeekend()) {
                continue;
            }
            $workingDayCount++;
            $dateStr = $date->format('Y-m-d');

            // --- Nati: Good Attendance (Present all days, 10 hours overtime total) ---
            $otNati = ($workingDayCount <= 5) ? 2.0 : 0.0; // 2 hrs OT on first 5 days = 10 hrs OT
            Attendance::updateOrCreate(
                ['employee_id' => $nati->employee_id, 'attendance_date' => $dateStr],
                [
                    'status' => 'present',
                    'clock_in' => $dateStr . ' 08:00:00',
                    'clock_out' => $dateStr . ' 17:00:00',
                    'late_minutes' => 0,
                    'overtime_hours' => $otNati,
                    'total_worked_hours' => 8.0 + $otNati,
                ]
            );

            // --- Abebe: Good Attendance (Present all days, 15 hours overtime total) ---
            $otAbebe = ($workingDayCount <= 5) ? 3.0 : 0.0; // 3 hrs OT on first 5 days = 15 hrs OT
            Attendance::updateOrCreate(
                ['employee_id' => $abebe->employee_id, 'attendance_date' => $dateStr],
                [
                    'status' => 'present',
                    'clock_in' => $dateStr . ' 08:00:00',
                    'clock_out' => $dateStr . ' 17:00:00',
                    'late_minutes' => 0,
                    'overtime_hours' => $otAbebe,
                    'total_worked_hours' => 8.0 + $otAbebe,
                ]
            );

            // --- Kebede: Bad Attendance (14 Present, 5 Absent, 3 Unpaid Leave, 6 Late) ---
            if ($workingDayCount <= 5) {
                // Absent for 5 days
                Attendance::updateOrCreate(
                    ['employee_id' => $kebede->employee_id, 'attendance_date' => $dateStr],
                    [
                        'status' => 'absent',
                        'clock_in' => null,
                        'clock_out' => null,
                        'late_minutes' => 0,
                        'overtime_hours' => 0,
                        'total_worked_hours' => 0,
                    ]
                );
            } elseif ($workingDayCount <= 11) {
                // Present but Late (6 days)
                Attendance::updateOrCreate(
                    ['employee_id' => $kebede->employee_id, 'attendance_date' => $dateStr],
                    [
                        'status' => 'present',
                        'clock_in' => $dateStr . ' 08:45:00',
                        'clock_out' => $dateStr . ' 17:00:00',
                        'late_minutes' => 45,
                        'overtime_hours' => 0,
                        'total_worked_hours' => 7.25,
                    ]
                );
            } else {
                // Present standard
                Attendance::updateOrCreate(
                    ['employee_id' => $kebede->employee_id, 'attendance_date' => $dateStr],
                    [
                        'status' => 'present',
                        'clock_in' => $dateStr . ' 08:00:00',
                        'clock_out' => $dateStr . ' 17:00:00',
                        'late_minutes' => 0,
                        'overtime_hours' => 0,
                        'total_worked_hours' => 8.0,
                    ]
                );
            }
        }
    }
}
