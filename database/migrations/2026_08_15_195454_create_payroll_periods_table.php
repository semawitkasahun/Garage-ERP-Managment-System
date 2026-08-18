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
        Schema::create('payroll_periods', function (Blueprint $table) {
            $table->id('payroll_period_id');
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('name')->comment('Period name like "August 2026"');
            $table->date('start_date')->nullable(false);
            $table->date('end_date')->nullable(false);
            $table->string('status', 30)->default('draft')->comment('draft, processing, pending_approval, approved, paid, cancelled');
            $table->text('notes')->nullable();
            
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users', 'user_id')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            
            $table->timestamps();
            
            $table->index('status');
            $table->index('start_date');
            $table->index('end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_periods');
    }
};
