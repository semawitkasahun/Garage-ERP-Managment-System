<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('equipment_transfers', function (Blueprint $table) {
      $table->id();
      $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
      $table->unsignedBigInteger('from_employee_id');
      $table->foreign('from_employee_id')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->unsignedBigInteger('to_employee_id');
      $table->foreign('to_employee_id')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->unsignedBigInteger('work_order_id')->nullable();
      $table->foreign('work_order_id')->references('work_order_id')->on('work_orders')->nullOnDelete();
      $table->unsignedBigInteger('job_card_id')->nullable();
      $table->foreign('job_card_id')->references('job_card_id')->on('job_cards')->nullOnDelete();
      $table->text('reason');
      $table->unsignedBigInteger('approved_by');
      $table->foreign('approved_by')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->foreignId('previous_checkout_id')->nullable()->constrained('equipment_checkouts')->nullOnDelete();
      $table->foreignId('new_checkout_id')->nullable()->constrained('equipment_checkouts')->nullOnDelete();
      $table->timestamp('transferred_at')->useCurrent();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('equipment_transfers');
  }
};
