<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_requisition_items', function (Blueprint $table) {
            $table->id('pr_item_id');
            
            $table->foreignId('requisition_id')
                ->constrained('purchase_requisitions', 'requisition_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // Foreign key to purchase_requisitions table whene requisition is deleted, delete the item
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to inventory_items table whene item is deleted, restrict the deletion
            
            $table->decimal('quantity_requested', 12, 2)->nullable(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requisition_items');
    }
};