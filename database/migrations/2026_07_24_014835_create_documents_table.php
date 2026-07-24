<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('documents', function (Blueprint $table) {
      $table->id('document_id');
      $table->string('entity_type', 30)->nullable(false);
      $table->integer('entity_id')->nullable(false);
      $table->string('doc_type', 50)->nullable();
      $table->string('file_path', 255)->nullable(false);

      $table->foreignId('uploaded_by')
        ->constrained('users', 'user_id')
        ->cascadeOnUpdate()
        ->restrictOnDelete();

      $table->timestamp('uploaded_at')->useCurrent();
      $table->timestamps();

      $table->index(['entity_type', 'entity_id']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('documents');
  }
};