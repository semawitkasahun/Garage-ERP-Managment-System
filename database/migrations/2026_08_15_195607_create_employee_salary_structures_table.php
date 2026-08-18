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
        Schema::create('employee_salary_structures', function (Blueprint $table) {
            $table->id('employee_salary_structure_id');
            
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('salary_structure_id')
                ->constrained('salary_structures', 'salary_structure_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            // Individual overrides
            $table->decimal('basic_salary_override', 12, 2)->nullable()->comment('Override for basic salary');
            $table->decimal('overtime_rate_override', 10, 2)->nullable()->comment('Override for overtime rate');
            
            $table->date('effective_date')->nullable(false);
            $table->date('end_date')->nullable()->comment('Null means currently active');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('employee_id');
            $table->index('salary_structure_id');
            $table->index('effective_date');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_salary_structures');
    }
};
