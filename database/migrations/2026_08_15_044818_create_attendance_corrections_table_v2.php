<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('attendance_corrections', function (Blueprint $table) {
            $table->id('correction_id');
            
            $table->foreignId('attendance_id')->constrained('attendance', 'attendance_id')->cascadeOnDelete();
            $table->unsignedBigInteger('corrected_by')->nullable();
            
            // Original values
            $table->timestamp('original_clock_in')->nullable();
            $table->timestamp('original_clock_out')->nullable();
            $table->string('original_status', 20)->nullable();
            
            // Corrected values
            $table->timestamp('corrected_clock_in')->nullable();
            $table->timestamp('corrected_clock_out')->nullable();
            $table->string('corrected_status', 20)->nullable();
            
            // Correction details
            $table->text('reason')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamp('correction_date')->useCurrent();
            
            $table->timestamps();
            
            $table->index('attendance_id');
            $table->index('corrected_by');
            $table->index('correction_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_corrections');
    }
};
