<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id('payroll_item_id');
            
            $table->foreignId('payroll_run_id')
                ->constrained('payroll_runs', 'payroll_run_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // if a payroll run is deleted, its items should also be deleted
            
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// if an employee is deleted, their payroll items should not be deleted
            
            $table->decimal('base_pay', 12, 2)->nullable();
            $table->decimal('overtime_pay', 12, 2)->nullable();
            $table->decimal('deductions', 12, 2)->nullable();
            $table->decimal('net_pay', 12, 2)->nullable();
            $table->timestamps();
            
            $table->unique(['payroll_run_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
    }
};