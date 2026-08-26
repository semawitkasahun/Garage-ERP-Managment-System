<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('equipment', function (Blueprint $table) {
      $table->id();
      $table->string('equipment_code')->unique();
      $table->string('name');
      $table->string('category');
      $table->string('brand')->nullable();
      $table->string('model')->nullable();
      $table->string('serial_number')->nullable()->unique();
      $table->string('qr_code')->unique();
      $table->string('current_location')->nullable();
      $table->enum('condition', ['New', 'Good', 'Fair', 'Poor', 'Damaged'])->default('Good');
      $table->enum('status', ['Available', 'Checked Out', 'Overdue', 'Maintenance', 'Missing', 'Retired'])->default('Available');
      $table->unsignedBigInteger('assigned_employee_id')->nullable();
      $table->foreign('assigned_employee_id')->references('employee_id')->on('employees')->nullOnDelete();
      $table->date('purchase_date')->nullable();
      $table->decimal('purchase_cost', 10, 2)->nullable();
      $table->date('last_maintenance_date')->nullable();
      $table->date('next_maintenance_due')->nullable();
      $table->text('notes')->nullable();
      $table->timestamps();
      $table->softDeletes();
      $table->index(['status', 'category']);
    });
  }
  public function down(): void
  {
    Schema::dropIfExists('equipment');
  }
};