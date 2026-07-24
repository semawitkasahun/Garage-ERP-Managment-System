<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_returns', function (Blueprint $table) {
            $table->id('sales_return_id');
            
            $table->foreignId('sales_order_id')
                ->constrained('sales_orders', 'sales_order_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('reason', 255)->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_returns');
    }
};