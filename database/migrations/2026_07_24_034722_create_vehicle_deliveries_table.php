<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_deliveries', function (Blueprint $table) {
            $table->id('delivery_id');
            
            $table->foreignId('work_order_id')
                ->constrained('work_orders', 'work_order_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('delivered_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('customer_signature_file', 255)->nullable();
            $table->text('delivery_checklist_notes')->nullable();
            $table->integer('feedback_rating')->nullable();
            $table->text('feedback_comments')->nullable();
            $table->timestamp('delivered_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_deliveries');
    }
};