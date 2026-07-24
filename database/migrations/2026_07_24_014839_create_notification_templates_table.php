<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('notification_templates', function (Blueprint $table) {
      $table->id('template_id');
      $table->string('name', 100)->nullable(false);
      $table->string('channel', 20)->nullable(false);
      $table->string('trigger_event', 50)->nullable();
      $table->string('subject', 150)->nullable();
      $table->text('body')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('notification_templates');
  }
};