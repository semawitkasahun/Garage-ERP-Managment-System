<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('equipment_requests', function (Blueprint $table) {
      $table->id();
      $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
      $table->unsignedBigInteger('requested_by');
      $table->foreign('requested_by')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->unsignedBigInteger('work_order_id')->nullable();
      $table->foreign('work_order_id')->references('work_order_id')->on('work_orders')->nullOnDelete();
      $table->unsignedBigInteger('job_card_id')->nullable();
      $table->foreign('job_card_id')->references('job_card_id')->on('job_cards')->nullOnDelete();
      $table->text('reason')->nullable();
      $table->enum('status', ['Pending', 'Approved', 'Rejected', 'Issued', 'Cancelled'])->default('Pending');
      $table->unsignedBigInteger('reviewed_by')->nullable();
      $table->foreign('reviewed_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->timestamp('reviewed_at')->nullable();
      $table->text('review_notes')->nullable();
      $table->timestamps();
      $table->index(['status', 'requested_by']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('equipment_requests');
  }
};
