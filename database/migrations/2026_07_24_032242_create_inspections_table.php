<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspections', function (Blueprint $table) {
            $table->id('inspection_id');
            
            $table->foreignId('checkin_id')
                ->nullable()
                ->constrained('vehicle_checkins', 'checkin_id')
                ->cascadeOnUpdate()
                ->nullOnDelete(); //if the checkin is deleted, the inspection should remain for record purposes
            
            $table->foreignId('vehicle_id')
                ->constrained('vehicles', 'vehicle_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); //if the vehicle is deleted, the inspection should remain for record purposes
            
            $table->foreignId('technician_id')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); //if the technician is deleted, the inspection should remain for record purposes
            
            $table->string('service_type', 50)->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspections');
    }
};