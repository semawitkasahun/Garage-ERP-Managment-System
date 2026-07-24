<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_evaluations', function (Blueprint $table) {
            $table->id('evaluation_id');
            
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // if an employee is deleted, their evaluations should not be deleted if they are still relevant then the evaluation can be archived or reassigned
            
            $table->foreignId('evaluator_id')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // if the evaluator is deleted, their evaluations should not be deleted
            
            $table->string('period', 20)->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->text('comments')->nullable();
            $table->timestamps();
            
            $table->index('period');
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_evaluations');
    }
};