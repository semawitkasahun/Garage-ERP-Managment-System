<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parts_requisitions', function (Blueprint $table) {
            $table->id('requisition_id');
            
            $table->foreignId('job_card_id')
                ->constrained('job_cards', 'job_card_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('task_id')
                ->nullable()
                ->constrained('job_card_tasks', 'task_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            
            $table->integer('inventory_item_id')->nullable();
            $table->decimal('quantity_requested', 10, 2)->nullable(false);
            $table->decimal('quantity_issued', 10, 2)->nullable();
            $table->string('status', 20)->nullable();
            
            $table->foreignId('requested_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parts_requisitions');
    }
};