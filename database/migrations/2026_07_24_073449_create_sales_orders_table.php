<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id('sales_order_id');
            
            $table->foreignId('customer_id')
                ->constrained('customers', 'customer_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to customers table when customer is deleted, restrict the deletion and prevent deletion of the sales order if customer is deleted all sales orders for that customer will be deleted
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to branches table whene branch is deleted, restrict the deletion if branch is deleted all sales orders for that branch will be deleted
            
            $table->string('status', 20)->nullable();
            $table->timestamp('order_date')->useCurrent();
            $table->decimal('subtotal', 12, 2)->nullable();
            $table->decimal('tax_amount', 12, 2)->nullable();
            $table->decimal('discount_amount', 12, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();
            
            $table->foreignId('created_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to users table whene user is deleted, restrict the deletion if user is deleted all sales orders created by that user will be deleted
            
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};