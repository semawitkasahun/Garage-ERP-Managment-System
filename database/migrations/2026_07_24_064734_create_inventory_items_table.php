<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id('item_id');
            $table->string('sku', 50)->unique()->nullable(false);
            $table->string('name', 150)->nullable(false);
            $table->string('description', 255)->nullable();
            $table->string('category', 50)->nullable();
            $table->string('unit_of_measure', 20)->nullable();
            $table->decimal('cost_price', 12, 2)->nullable();
            $table->decimal('sell_price', 12, 2)->nullable();
            $table->decimal('reorder_point', 10, 2)->nullable();
            $table->boolean('is_serialized')->default(false);
            $table->boolean('is_batch_tracked')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('sku');
            $table->index('category');
            $table->foreignId('section_id')
            ->nullable();

        });
        
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};