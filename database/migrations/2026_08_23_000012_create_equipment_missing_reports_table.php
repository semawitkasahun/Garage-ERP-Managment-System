<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('equipment_missing_reports', function (Blueprint $table) {
      $table->id();
      $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
      $table->unsignedBigInteger('last_employee_id')->nullable();
      $table->foreign('last_employee_id')->references('employee_id')->on('employees')->nullOnDelete();
      $table->unsignedBigInteger('last_work_order_id')->nullable();
      $table->foreign('last_work_order_id')->references('work_order_id')->on('work_orders')->nullOnDelete();
      $table->unsignedBigInteger('last_job_card_id')->nullable();
      $table->foreign('last_job_card_id')->references('job_card_id')->on('job_cards')->nullOnDelete();
      $table->string('last_known_location')->nullable();
      $table->timestamp('checkout_date')->nullable();
      $table->timestamp('last_scanned_at')->nullable();
      $table->unsignedBigInteger('reported_by');
      $table->foreign('reported_by')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->timestamp('reported_at')->useCurrent();
      $table->text('notes')->nullable();
      $table->json('photos')->nullable();
      $table->enum('status', ['Open', 'Found', 'Found Damaged'])->default('Open');
      $table->timestamp('resolved_at')->nullable();
      $table->text('resolved_notes')->nullable();
      $table->unsignedBigInteger('resolved_by')->nullable();
      $table->foreign('resolved_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->timestamps();
      $table->index(['equipment_id', 'status']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('equipment_missing_reports');
  }
};
