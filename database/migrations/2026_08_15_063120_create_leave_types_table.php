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
        Schema::create('leave_types', function (Blueprint $table) {
            $table->bigIncrements('leave_type_id');
            
            $table->string('name', 100)->nullable(false);
            $table->text('description')->nullable();
            
            // Configuration
            $table->boolean('is_paid')->default(true);
            $table->integer('max_days')->default(30);
            $table->boolean('requires_approval')->default(true);
            $table->boolean('requires_document')->default(false);
            
            // Department/branch specific
            $table->foreignId('branch_id')->nullable()->constrained('branches', 'branch_id')->nullOnDelete();
            
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
        Schema::dropIfExists('leave_types');
    }
};
