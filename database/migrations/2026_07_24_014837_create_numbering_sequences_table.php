<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('numbering_sequences', function (Blueprint $table) {
            $table->id('sequence_id');
            $table->string('entity_type', 30)->nullable(false);
            
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->string('prefix', 10)->nullable();
            $table->bigInteger('next_number')->default(1);
            $table->timestamps();
            
            $table->unique(['entity_type', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('numbering_sequences');
    }
};