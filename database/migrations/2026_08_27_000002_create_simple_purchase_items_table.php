<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simple_purchase_items', function (Blueprint $table) {
            $table->id('purchase_item_id');

            $table->foreignId('purchase_id')
                ->constrained('simple_purchases', 'purchase_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string('item_name', 150)->nullable(false);
            $table->decimal('quantity', 12, 2)->nullable(false);
            $table->decimal('unit_price', 12, 2)->nullable(false);
            $table->decimal('total', 12, 2)->nullable(false);

            $table->foreignId('inventory_item_id')
                ->nullable()
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->timestamps();

            $table->index('purchase_id');
            $table->index('inventory_item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simple_purchase_items');
    }
};
