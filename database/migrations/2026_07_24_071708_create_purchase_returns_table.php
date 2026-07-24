<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id('return_id');
            
            $table->foreignId('po_id')
                ->constrained('purchase_orders', 'po_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to purchase_orders table when a purchase order is deleted, restrict the deletion
            
            $table->foreignId('supplier_id')
                ->constrained('suppliers', 'supplier_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to suppliers table when a supplier is deleted, restrict the deletion
            
            $table->string('reason', 255)->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamps();//foreign key to users table when a user is deleted, restrict the deletion
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_returns');
    }
};