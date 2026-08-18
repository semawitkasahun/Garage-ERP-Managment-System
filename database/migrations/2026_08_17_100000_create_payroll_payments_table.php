<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_payments', function (Blueprint $table) {
            $table->id('payroll_payment_id');
            $table->unsignedBigInteger('payroll_item_id');
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('payroll_period_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method', 50); // bank_transfer, cash, other
            $table->date('payment_date');
            $table->string('payment_reference', 100)->nullable();
            $table->string('receipt_number', 50)->unique();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('processed_by')->nullable();
            $table->string('status', 30)->default('paid');
            $table->timestamps();

            $table->foreign('payroll_item_id')->references('payroll_item_id')->on('payroll_items')->onDelete('cascade');
            $table->foreign('employee_id')->references('employee_id')->on('employees')->onDelete('cascade');
            $table->foreign('payroll_period_id')->references('payroll_period_id')->on('payroll_periods')->onDelete('set null');
            $table->foreign('processed_by')->references('user_id')->on('users')->onDelete('set null');

            $table->index(['employee_id', 'payroll_period_id']);
            $table->index('receipt_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_payments');
    }
};
