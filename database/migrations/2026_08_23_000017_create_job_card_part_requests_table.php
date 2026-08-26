<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('job_card_part_requests', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('job_card_id');
      $table->foreign('job_card_id')->references('job_card_id')->on('job_cards')->cascadeOnDelete();
      $table->unsignedBigInteger('work_order_id')->nullable();
      $table->foreign('work_order_id')->references('work_order_id')->on('work_orders')->nullOnDelete();
      $table->unsignedBigInteger('inventory_item_id');
      $table->foreign('inventory_item_id')->references('item_id')->on('inventory_items')->cascadeOnDelete();
      $table->unsignedBigInteger('requested_by');
      $table->foreign('requested_by')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->decimal('requested_quantity', 12, 2);
      $table->decimal('approved_quantity', 12, 2)->nullable();
      $table->decimal('issued_quantity', 12, 2)->default(0);
      $table->decimal('returned_quantity', 12, 2)->default(0);
      $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Issued', 'Partially Returned', 'Returned', 'Cancelled'])->default('Pending');
      $table->text('reason')->nullable();
      $table->unsignedBigInteger('approved_by')->nullable();
      $table->foreign('approved_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->timestamp('approved_at')->nullable();
      $table->unsignedBigInteger('issued_by')->nullable();
      $table->foreign('issued_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->timestamp('issued_at')->nullable();
      $table->timestamps();
      $table->index(['job_card_id', 'status']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('job_card_part_requests');
  }
};
