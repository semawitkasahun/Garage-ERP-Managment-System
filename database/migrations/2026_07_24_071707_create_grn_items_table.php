<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id('grn_item_id');
            
            $table->foreignId('grn_id')
                ->constrained('goods_received_notes', 'grn_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();// Foreign key to goods_received_notes table whene grn is deleted, delete the grn item
            
            $table->foreignId('po_item_id')
                ->constrained('purchase_order_items', 'po_item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to purchase_order_items table whene po item is deleted, restrict the deletion
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to inventory_items table whene item is deleted, restrict the deletion
            
            $table->decimal('quantity_received', 12, 2)->nullable(false);
            $table->string('batch_or_serial_no', 50)->nullable();
            $table->string('condition', 20)->nullable(); // good, damaged
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};