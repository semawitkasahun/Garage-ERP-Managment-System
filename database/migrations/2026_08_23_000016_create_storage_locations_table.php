<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('storage_locations', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->foreignId('parent_id')->nullable()->constrained('storage_locations')->cascadeOnDelete();
      $table->enum('type', ['Store', 'Shelf', 'Bin', 'Other'])->default('Other');
      $table->text('notes')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('storage_locations');
  }
};
