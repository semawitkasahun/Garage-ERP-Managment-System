<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quality_control_checks', function (Blueprint $table) {
            $table->id('qc_id');
            
            $table->foreignId('job_card_id')
                ->constrained('job_cards', 'job_card_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->foreignId('inspector_id')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('result', 10)->nullable(); // pass, fail
            $table->text('notes')->nullable();
            $table->timestamp('checked_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quality_control_checks');
    }
};