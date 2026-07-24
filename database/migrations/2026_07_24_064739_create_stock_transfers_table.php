<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id('transfer_id');
            
            $table->foreignId('item_id')
                ->constrained('inventory_items', 'item_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('from_branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('to_branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->decimal('quantity', 12, 2)->nullable(false);
            $table->string('status', 20)->nullable();
            
            $table->foreignId('requested_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamp('transferred_at')->nullable();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};