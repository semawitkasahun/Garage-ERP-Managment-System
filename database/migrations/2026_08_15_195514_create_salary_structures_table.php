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
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->id('salary_structure_id');
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments', 'department_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            
            $table->string('name')->comment('Structure name like "Technician Grade 1"');
            $table->string('code')->unique()->comment('Unique code like "TECH-GR1"');
            $table->text('description')->nullable();
            
            // Basic salary configuration
            $table->decimal('basic_salary', 12, 2)->default(0);
            $table->string('salary_type')->default('monthly')->comment('monthly, daily, hourly');
            
            // Payment frequency
            $table->string('payment_frequency')->default('monthly')->comment('weekly, bi-weekly, monthly');
            
            // Overtime settings
            $table->decimal('overtime_rate', 10, 2)->default(0)->comment('Overtime rate per hour');
            $table->string('overtime_calculation')->default('standard')->comment('standard, double, custom');
            
            // Tax settings
            $table->decimal('tax_rate', 5, 2)->default(0)->comment('Default tax rate percentage');
            $table->boolean('taxable')->default(true);
            
            // Working days configuration
            $table->integer('working_days_per_month')->default(26);
            $table->integer('working_hours_per_day')->default(8);
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_structures');
    }
};
