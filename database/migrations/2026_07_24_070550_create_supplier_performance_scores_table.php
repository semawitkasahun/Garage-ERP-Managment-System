<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_performance_scores', function (Blueprint $table) {
            $table->id('score_id');
            
            $table->foreignId('supplier_id')
                ->constrained('suppliers', 'supplier_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // Foreign key to suppliers table when supplier is deleted, delete the performance score
            
            $table->string('period', 20)->nullable(); // e.g., '2026-Q2'
            $table->decimal('on_time_delivery_pct', 5, 2)->nullable();
            $table->decimal('quality_score', 5, 2)->nullable();
            $table->decimal('pricing_score', 5, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_performance_scores');
    }
};