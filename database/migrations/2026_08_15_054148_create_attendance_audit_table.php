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
        Schema::create('attendance_audit', function (Blueprint $table) {
            $table->bigIncrements('audit_id');
            
            // Employee and attendance reference
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->foreignId('attendance_id')->nullable()->constrained('attendance', 'attendance_id')->nullOnDelete();
            
            // Action details
            $table->enum('action', ['check_in', 'check_out', 'correction', 'manual_entry', 'token_generated', 'token_used'])->nullable(false);
            $table->string('method', 20)->nullable(); // qr, manual, etc.
            
            // Branch context
            $table->foreignId('branch_id')->nullable()->constrained('branches', 'branch_id')->nullOnDelete();
            
            // Security context
            $table->foreignId('qr_token_id')->nullable()->constrained('qr_attendance_tokens', 'token_id')->nullOnDelete();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            
            // Additional details
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable(); // Store additional context
            
            // Timestamps
            $table->timestamp('action_timestamp')->useCurrent();
            $table->timestamps();
            
            // Indexes
            $table->index('employee_id');
            $table->index('attendance_id');
            $table->index('action');
            $table->index('action_timestamp');
            $table->index('qr_token_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_audit');
    }
};
