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
        Schema::create('leave_balances', function (Blueprint $table) {
            $table->bigIncrements('balance_id');
            
            // Employee and leave type
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types', 'leave_type_id')->cascadeOnDelete();
            
            // Balance tracking
            $table->integer('entitled_days')->default(0);
            $table->integer('used_days')->default(0);
            $table->integer('pending_days')->default(0);
            $table->integer('remaining_days')->default(0);
            
            // Year-based tracking
            $table->integer('year')->nullable(false);
            
            $table->timestamps();
            
            $table->unique(['employee_id', 'leave_type_id', 'year']);
            $table->index('employee_id');
            $table->index('leave_type_id');
            $table->index('year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_balances');
    }
};
