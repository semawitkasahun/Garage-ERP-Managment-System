<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('goods_received_notes', function (Blueprint $table) {
            $table->id('grn_id');
            
            $table->foreignId('po_id')
                ->constrained('purchase_orders', 'po_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to purchase_orders table when purchase order is deleted, restrict the deletion meaning that the GRN cannot exist without a purchase order
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to branches table whene branch is deleted, restrict the deletion
            
            $table->foreignId('received_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to users table whene user is deleted, restrict the deletion
            
            $table->string('status', 20)->nullable(); // partial, complete
            $table->timestamp('received_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goods_received_notes');
    }
};