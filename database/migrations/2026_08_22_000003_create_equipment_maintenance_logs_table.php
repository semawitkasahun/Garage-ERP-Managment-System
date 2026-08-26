<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('equipment_maintenance_logs', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('equipment_id');
      $table->foreign('equipment_id')->references('id')->on('equipment')->cascadeOnDelete();
      $table->unsignedBigInteger('logged_by')->nullable();
      $table->foreign('logged_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->enum('type', ['Routine', 'Repair', 'Inspection', 'Calibration', 'Other'])->default('Routine');
      $table->text('description');
      $table->decimal('cost', 10, 2)->nullable();
      $table->string('performed_by')->nullable();
      $table->date('performed_at');
      $table->date('next_due_at')->nullable();
      $table->timestamps();
      $table->index('equipment_id');
    });
  }
  public function down(): void
  {
    Schema::dropIfExists('equipment_maintenance_logs');
  }
};