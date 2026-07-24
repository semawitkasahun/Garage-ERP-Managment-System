<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id('soi_id');
            
            $table->foreignId('sales_order_id')
                ->constrained('sales_orders', 'sales_order_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->decimal('quantity', 12, 2)->nullable(false);
            $table->decimal('unit_price', 12, 2)->nullable(false);
            $table->decimal('discount_amount', 12, 2)->nullable();
            $table->decimal('line_total', 12, 2)->nullable(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_order_items');
    }
};