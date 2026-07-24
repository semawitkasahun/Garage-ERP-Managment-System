<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_price_list_items', function (Blueprint $table) {
            $table->id('pli_id');
            
            $table->foreignId('price_list_id')
                ->constrained('supplier_price_lists', 'price_list_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // Foreign key to supplier_price_lists table whene price list is deleted, delete the price list item
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to inventory_items table whene item is deleted, restrict the deletion
            
            $table->decimal('unit_price', 12, 2)->nullable(false);
            $table->timestamps();
            
            $table->unique(['price_list_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_price_list_items');
    }
};