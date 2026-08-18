<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create sections table
        Schema::create('sections', function (Blueprint $table) {
            $table->id('section_id');
            $table->string('name', 100)->nullable(false);
            $table->string('code', 20)->unique()->nullable(false);
            $table->text('description')->nullable();
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('manager_id')
                ->nullable()
                ->constrained('employees', 'employee_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('status', 20)->default('active');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Note: section_id foreign keys are added in separate migrations to avoid dependency issues
    }

    public function down(): void
    {
        Schema::dropIfExists('sections');
    }
};