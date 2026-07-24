<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_cards', function (Blueprint $table) {
            $table->id('job_card_id');
            
            $table->foreignId('work_order_id')
                ->constrained('work_orders', 'work_order_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->string('description', 255)->nullable();
            $table->string('status', 20)->nullable();
            $table->string('priority', 10)->nullable();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_cards');
    }
};