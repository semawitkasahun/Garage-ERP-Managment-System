<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id('batch_id');
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('batch_or_serial_no', 50)->nullable();
            $table->decimal('quantity', 12, 2)->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamps();
            
            $table->index('batch_or_serial_no');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};