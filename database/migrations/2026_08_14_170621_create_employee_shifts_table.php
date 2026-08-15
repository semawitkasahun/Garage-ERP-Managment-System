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
        Schema::create('employee_shifts', function (Blueprint $table) {
            $table->id('employee_shift_id');
            
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('shift_id')
                ->constrained('shifts', 'shift_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->date('effective_date')->nullable(false);
            $table->date('end_date')->nullable();
            
            $table->boolean('is_primary')->default(true);
            
            $table->timestamps();
            
            $table->unique(['employee_id', 'shift_id', 'effective_date']);
            $table->index('employee_id');
            $table->index('shift_id');
            $table->index('effective_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_shifts');
    }
};
