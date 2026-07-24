<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id('budget_id');
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('account_id')
                ->constrained('chart_of_accounts', 'account_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('period', 20)->nullable(); // e.g., '2026-Q3'
            $table->decimal('budget_amount', 14, 2)->nullable();
            $table->decimal('actual_amount', 14, 2)->nullable();
            $table->timestamps();
            
            $table->unique(['branch_id', 'account_id', 'period']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};