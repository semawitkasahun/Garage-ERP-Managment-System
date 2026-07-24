<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('complaints_feedback', function (Blueprint $table) {
            $table->id('feedback_id');
            
            $table->foreignId('customer_id')
                ->constrained('customers', 'customer_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('related_entity_type', 30)->nullable();
            $table->integer('related_entity_id')->nullable();
            $table->string('type', 20)->nullable(false);
            $table->text('description')->nullable();
            $table->string('status', 20)->nullable();
            $table->text('resolution')->nullable();
            $table->timestamps();
            
            $table->index(['related_entity_type', 'related_entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('complaints_feedback');
    }
};
