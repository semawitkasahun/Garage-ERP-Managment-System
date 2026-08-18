<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            // Attendance integration fields
            $table->integer('working_days')->default(0)->after('net_pay');
            $table->integer('days_present')->default(0)->after('working_days');
            $table->integer('paid_leave_days')->default(0)->after('days_present');
            $table->integer('unpaid_leave_days')->default(0)->after('paid_leave_days');
            $table->decimal('overtime_hours', 8, 2)->default(0)->after('unpaid_leave_days');
            
            // Detailed earnings breakdown
            $table->decimal('basic_salary', 12, 2)->default(0)->after('overtime_hours');
            $table->decimal('total_allowances', 12, 2)->default(0)->after('basic_salary');
            $table->decimal('gross_salary', 12, 2)->default(0)->after('total_allowances');
            
            // Rename base_pay to maintain backward compatibility temporarily
            if (Schema::hasColumn('payroll_items', 'base_pay')) {
                $table->renameColumn('base_pay', 'legacy_base_pay');
            }
            
            // Status for individual payroll item
            $table->string('status', 30)->default('pending')->after('gross_salary')->comment('pending, calculated, approved, paid');
            
            // Link to payroll period
            $table->foreignId('payroll_period_id')
                ->nullable()
                ->constrained('payroll_periods', 'payroll_period_id')
                ->cascadeOnUpdate()
                ->nullOnDelete()
                ->after('payroll_run_id');
            
            // Link to salary structure used
            $table->foreignId('salary_structure_id')
                ->nullable()
                ->constrained('salary_structures', 'salary_structure_id')
                ->cascadeOnUpdate()
                ->nullOnDelete()
                ->after('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropColumn([
                'working_days',
                'days_present',
                'paid_leave_days',
                'unpaid_leave_days',
                'overtime_hours',
                'basic_salary',
                'total_allowances',
                'gross_salary',
                'status',
                'payroll_period_id',
                'salary_structure_id'
            ]);
            
            if (Schema::hasColumn('payroll_items', 'legacy_base_pay')) {
                $table->renameColumn('legacy_base_pay', 'base_pay');
            }
        });
    }
};
