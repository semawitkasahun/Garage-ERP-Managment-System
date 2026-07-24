<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_card_tasks', function (Blueprint $table) {
            $table->id('task_id');
            
            $table->foreignId('job_card_id')
                ->constrained('job_cards', 'job_card_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('quotation_item_id')
                ->nullable()
                ->constrained('quotation_items', 'quotation_item_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            
            $table->foreignId('technician_id')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('task_description', 255)->nullable();
            $table->decimal('estimated_hours', 6, 2)->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamp('start_time')->nullable();
            $table->timestamp('end_time')->nullable();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_card_tasks');
    }
};