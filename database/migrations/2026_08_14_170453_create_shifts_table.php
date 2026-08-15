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
        Schema::create('shifts', function (Blueprint $table) {
            $table->id('shift_id');
            
            $table->string('name', 100)->nullable(false);
            $table->foreignId('branch_id')->nullable()->constrained('branches', 'branch_id')->nullOnDelete();
            
            // Shift timing
            $table->time('start_time')->nullable(false);
            $table->time('end_time')->nullable(false);
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->integer('break_duration_minutes')->default(0);
            
            // Work hours calculation
            $table->decimal('expected_hours', 5, 2)->default(8);
            
            // Overtime settings
            $table->decimal('overtime_threshold', 5, 2)->default(8);
            $table->decimal('overtime_rate', 5, 2)->default(1.5);
            
            // Late tolerance
            $table->integer('grace_period_minutes')->default(15);
            
            // Shift pattern
            $table->enum('pattern', ['daily', 'weekly', 'custom'])->default('daily');
            $table->json('working_days')->nullable(); // e.g., [1,2,3,4,5] for Mon-Fri
            
            // Status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            
            $table->index('branch_id');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
