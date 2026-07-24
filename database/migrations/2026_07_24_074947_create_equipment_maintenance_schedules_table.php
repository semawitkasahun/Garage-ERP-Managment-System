<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_maintenance_schedules', function (Blueprint $table) {
            $table->id('schedule_id');
            
            $table->foreignId('asset_id')
                ->constrained('assets', 'asset_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->string('maintenance_type', 50)->nullable(); // preventive, calibration, safety
            $table->integer('frequency_days')->nullable();
            $table->date('last_performed')->nullable();
            $table->date('next_due')->nullable();
            $table->timestamps();
            
            $table->index('next_due');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_maintenance_schedules');
    }
};