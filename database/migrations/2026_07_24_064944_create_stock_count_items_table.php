<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_count_items', function (Blueprint $table) {
            $table->id('count_item_id');
            
            $table->foreignId('count_id')
                ->constrained('stock_counts', 'count_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->decimal('system_qty', 12, 2)->nullable();
            $table->decimal('counted_qty', 12, 2)->nullable();
            $table->decimal('variance', 12, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_count_items');
    }
};