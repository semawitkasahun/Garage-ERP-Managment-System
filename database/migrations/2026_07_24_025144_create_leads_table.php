<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id('lead_id');
            
            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('customers', 'customer_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            
            $table->string('source', 50)->nullable();
            $table->string('status', 30)->nullable();
            
            $table->foreignId('assigned_to')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};