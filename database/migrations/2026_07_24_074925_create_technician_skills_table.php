<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technician_skills', function (Blueprint $table) {
            $table->id('skill_id');
            
            $table->foreignId('employee_id')
                ->constrained('employees', 'employee_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // if an employee is deleted, their skills should also be deleted
            
            $table->string('skill_name', 100)->nullable();
            $table->string('certification_name', 100)->nullable();
            $table->date('certified_at')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamps();
            
            $table->index('skill_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('technician_skills');
    }
};