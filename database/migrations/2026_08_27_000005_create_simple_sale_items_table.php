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
        Schema::create('simple_sale_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->unsignedBigInteger('sale_id');
            $table->unsignedBigInteger('inventory_item_id')->nullable();
            $table->string('item_name');
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total', 12, 2);
            $table->timestamps();

            $table->foreign('sale_id')->references('sale_id')->on('simple_sales')->onDelete('cascade');
            $table->foreign('inventory_item_id')->references('item_id')->on('inventory_items')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('simple_sale_items');
    }
};
