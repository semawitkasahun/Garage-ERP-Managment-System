<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dateTime('reviewed_at')->nullable()->after('status');
            $table->unsignedBigInteger('reviewed_by')->nullable()->after('reviewed_at');
            $table->dateTime('approved_at')->nullable()->after('reviewed_by');
            $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
            $table->dateTime('paid_at')->nullable()->after('approved_by');
            $table->integer('absent_days')->default(0)->after('paid_at');
            $table->integer('late_days')->default(0)->after('absent_days');
            $table->integer('leave_days')->default(0)->after('late_days');
            $table->decimal('attendance_deduction', 12, 2)->default(0)->after('leave_days');
            $table->decimal('tax_amount', 12, 2)->default(0)->after('attendance_deduction');
            $table->decimal('pension_amount', 12, 2)->default(0)->after('tax_amount');
            $table->decimal('bonuses', 12, 2)->default(0)->after('pension_amount');

            $table->foreign('reviewed_by')->references('user_id')->on('users')->onDelete('set null');
            $table->foreign('approved_by')->references('user_id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            $table->dropForeign(['reviewed_by']);
            $table->dropForeign(['approved_by']);
            $table->dropColumn([
                'reviewed_at', 'reviewed_by',
                'approved_at', 'approved_by',
                'paid_at',
                'absent_days', 'late_days', 'leave_days',
                'attendance_deduction',
                'tax_amount', 'pension_amount', 'bonuses',
            ]);
        });
    }
};
