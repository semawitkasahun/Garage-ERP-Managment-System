<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('inventory_transactions', function (Blueprint $table) {
      $table->id();
      $table->string('transaction_code')->unique();
      $table->unsignedBigInteger('inventory_item_id');
      $table->foreign('inventory_item_id')->references('item_id')->on('inventory_items')->cascadeOnDelete();
      $table->enum('type', ['Receive', 'Issue', 'Return', 'Transfer', 'Adjustment']);
      $table->decimal('quantity', 12, 2);
      $table->decimal('previous_quantity', 12, 2);
      $table->decimal('new_quantity', 12, 2);
      $table->text('reason')->nullable();
      $table->string('reference')->nullable();
      $table->unsignedBigInteger('work_order_id')->nullable();
      $table->foreign('work_order_id')->references('work_order_id')->on('work_orders')->nullOnDelete();
      $table->unsignedBigInteger('job_card_id')->nullable();
      $table->foreign('job_card_id')->references('job_card_id')->on('job_cards')->nullOnDelete();
      $table->unsignedBigInteger('from_location_id')->nullable();
      $table->unsignedBigInteger('to_location_id')->nullable();
      $table->unsignedBigInteger('performed_by')->nullable();
      $table->foreign('performed_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->timestamps();
      $table->index(['inventory_item_id', 'created_at']);
      $table->index('type');
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('inventory_transactions');
  }
};
