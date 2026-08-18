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
        Schema::table('payroll_runs', function (Blueprint $table) {
            // Check if columns exist before adding them
            if (!Schema::hasColumn('payroll_runs', 'name')) {
                $table->string('name')->nullable()->after('status')->comment('Payroll period name like "August 2026"');
            }
            if (!Schema::hasColumn('payroll_runs', 'total_gross_pay')) {
                $table->decimal('total_gross_pay', 15, 2)->default(0)->after('processed_at');
            }
            if (!Schema::hasColumn('payroll_runs', 'total_deductions')) {
                $table->decimal('total_deductions', 15, 2)->default(0)->after('total_gross_pay');
            }
            if (!Schema::hasColumn('payroll_runs', 'total_net_pay')) {
                $table->decimal('total_net_pay', 15, 2)->default(0)->after('total_deductions');
            }
            if (!Schema::hasColumn('payroll_runs', 'total_employees')) {
                $table->integer('total_employees')->default(0)->after('total_net_pay');
            }
            if (!Schema::hasColumn('payroll_runs', 'calculated_at')) {
                $table->timestamp('calculated_at')->nullable()->after('total_employees');
            }
            if (!Schema::hasColumn('payroll_runs', 'approved_at')) {
                $table->timestamp('approved_at')->nullable()->after('calculated_at');
            }
            if (!Schema::hasColumn('payroll_runs', 'approved_by')) {
                $table->foreignId('approved_by')->nullable()->constrained('users', 'user_id')->nullOnDelete()->after('approved_at');
            }
            if (!Schema::hasColumn('payroll_runs', 'paid_at')) {
                $table->timestamp('paid_at')->nullable()->after('approved_by');
            }
            
            // Update status field to support more comprehensive workflow
            $table->string('status', 30)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_runs', function (Blueprint $table) {
            // Only drop columns that exist
            $columnsToDrop = [];
            if (Schema::hasColumn('payroll_runs', 'name')) $columnsToDrop[] = 'name';
            if (Schema::hasColumn('payroll_runs', 'total_gross_pay')) $columnsToDrop[] = 'total_gross_pay';
            if (Schema::hasColumn('payroll_runs', 'total_deductions')) $columnsToDrop[] = 'total_deductions';
            if (Schema::hasColumn('payroll_runs', 'total_net_pay')) $columnsToDrop[] = 'total_net_pay';
            if (Schema::hasColumn('payroll_runs', 'total_employees')) $columnsToDrop[] = 'total_employees';
            if (Schema::hasColumn('payroll_runs', 'calculated_at')) $columnsToDrop[] = 'calculated_at';
            if (Schema::hasColumn('payroll_runs', 'approved_at')) $columnsToDrop[] = 'approved_at';
            if (Schema::hasColumn('payroll_runs', 'approved_by')) $columnsToDrop[] = 'approved_by';
            if (Schema::hasColumn('payroll_runs', 'paid_at')) $columnsToDrop[] = 'paid_at';
            
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
            
            $table->string('status', 20)->change();
        });
    }
};
