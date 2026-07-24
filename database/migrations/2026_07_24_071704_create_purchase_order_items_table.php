<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id('po_item_id');
            
            $table->foreignId('po_id')
                ->constrained('purchase_orders', 'po_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->decimal('quantity_ordered', 12, 2)->nullable(false);
            $table->decimal('unit_cost', 12, 2)->nullable(false);
            $table->decimal('quantity_received', 12, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_items');
    }
};