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
        Schema::create('qr_attendance_tokens', function (Blueprint $table) {
            $table->bigIncrements('token_id');
            
            // Cryptographically secure token (64 character hex string)
            $table->string('token', 64)->unique()->nullable(false);
            
            // Branch/garage association
            $table->foreignId('branch_id')->constrained('branches', 'branch_id')->cascadeOnDelete();
            
            // Timestamps for security
            $table->timestamp('expires_at')->nullable(false);
            $table->timestamp('created_at')->useCurrent();
            
            // Token usage tracking
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->foreignId('used_by_employee_id')->nullable()->constrained('employees', 'employee_id')->nullOnDelete();
            
            // Additional security context
            $table->string('generator_ip', 45)->nullable();
            $table->string('generator_user_agent', 255)->nullable();
            
            // Indexes for quick lookups
            $table->index('token');
            $table->index('branch_id');
            $table->index('expires_at');
            $table->index('is_used');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('qr_attendance_tokens');
    }
};
