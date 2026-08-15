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
        Schema::create('overtime_records', function (Blueprint $table) {
            $table->id('overtime_id');
            
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->foreignId('attendance_id')->nullable()->constrained('attendance', 'attendance_id')->nullOnDelete();
            
            // Time tracking
            $table->date('overtime_date')->nullable(false);
            $table->decimal('regular_hours', 5, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            
            // Approval details
            $table->string('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();
            
            // Calculated data for payroll
            $table->decimal('overtime_rate', 5, 2)->default(1.5);
            $table->decimal('total_overtime_pay', 10, 2)->default(0);
            
            $table->timestamps();
            
            $table->index('employee_id');
            $table->index('overtime_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('overtime_records');
    }
};
