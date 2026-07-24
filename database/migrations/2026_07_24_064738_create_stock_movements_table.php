<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id('movement_id');
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // The branch where the stock movement occurred
            
            $table->string('movement_type', 20)->nullable(false); // issue, receipt, transfer, adjustment, return
            $table->decimal('quantity', 12, 2)->nullable(false);
            $table->string('reference_type', 30)->nullable();
            $table->integer('reference_id')->nullable();
            
            $table->foreignId('moved_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamp('moved_at')->useCurrent();
            $table->timestamps();
            
            $table->index(['reference_type', 'reference_id']);
            $table->index('movement_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};