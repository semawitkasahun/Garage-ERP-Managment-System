<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id('return_item_id');
            
            $table->foreignId('return_id')
                ->constrained('purchase_returns', 'return_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();// Foreign key to purchase_returns table whene return is deleted, delete the item
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to inventory_items table whene item is deleted, restrict the deletion
            
            $table->decimal('quantity_returned', 12, 2)->nullable(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
    }
};