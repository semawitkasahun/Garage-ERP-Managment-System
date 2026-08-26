<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('equipment_checkouts', function (Blueprint $table) {
      $table->id();
      $table->foreignId('equipment_id')->constrained('equipment')->cascadeOnDelete();
      $table->unsignedBigInteger('employee_id');
      $table->foreign('employee_id')->references('employee_id')->on('employees')->cascadeOnDelete();
      $table->unsignedBigInteger('checked_out_by')->nullable();
      $table->foreign('checked_out_by')->references('employee_id')->on('employees')->nullOnDelete();
      $table->unsignedBigInteger('returned_to')->nullable();
      $table->foreign('returned_to')->references('employee_id')->on('employees')->nullOnDelete();
      $table->dateTime('checked_out_at');
      $table->dateTime('due_at');
      $table->dateTime('returned_at')->nullable();
      $table->string('condition_on_return')->nullable();
      $table->text('checkout_notes')->nullable();
      $table->text('return_notes')->nullable();
      $table->timestamps();
      $table->index(['equipment_id', 'returned_at']);
    });
  }
  public function down(): void
  {
    Schema::dropIfExists('equipment_checkouts');
  }
};