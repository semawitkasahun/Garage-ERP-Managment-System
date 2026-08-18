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
        Schema::create('payroll_allowances', function (Blueprint $table) {
            $table->id('payroll_allowance_id');
            
            $table->foreignId('payroll_item_id')
                ->constrained('payroll_items', 'payroll_item_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('allowance_id')
                ->constrained('allowances', 'allowance_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->decimal('amount', 10, 2)->default(0);
            $table->boolean('is_taxable')->default(true);
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            $table->index('payroll_item_id');
            $table->index('allowance_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_allowances');
    }
};
