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

        // Add section_id to employees table
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'section_id')) {
                $table->foreignId('section_id')
                    ->nullable()
                    ->after('branch_id')
                    ->constrained('sections', 'section_id')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });

        // Add section_id to work_orders table
        Schema::table('work_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('work_orders', 'section_id')) {
                $table->foreignId('section_id')
                    ->nullable()
                    ->after('branch_id')
                    ->constrained('sections', 'section_id')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });

        // Add section_id to inventory_items table
        Schema::table('inventory_items', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_items', 'section_id')) {
                $table->foreignId('section_id')
                    ->nullable()
                    ->after('category')
                    ->constrained('sections', 'section_id')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        // Drop foreign keys first
        Schema::table('inventory_items', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_items', 'section_id')) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            }
        });

        Schema::table('work_orders', function (Blueprint $table) {
            if (Schema::hasColumn('work_orders', 'section_id')) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            }
        });

        Schema::table('employees', function (Blueprint $table) {
            if (Schema::hasColumn('employees', 'section_id')) {
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');
            }
        });

        Schema::dropIfExists('sections');
    }
};