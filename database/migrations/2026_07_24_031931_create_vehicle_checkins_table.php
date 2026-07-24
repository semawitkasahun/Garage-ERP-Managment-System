<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_checkins', function (Blueprint $table) {
            $table->id('checkin_id');
            
            $table->foreignId('appointment_id')
                ->nullable()
                ->constrained('appointments', 'appointment_id')
                ->cascadeOnUpdate()
                ->nullOnDelete(); //if the appointment is deleted, the checkin should remain for record purposes
            
            $table->foreignId('vehicle_id')
                ->constrained('vehicles', 'vehicle_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); //if the vehicle is deleted, the checkin should remain for record purposes
            
            $table->foreignId('customer_id')
                ->constrained('customers', 'customer_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->integer('mileage_in')->nullable();
            $table->string('fuel_level', 10)->nullable();
            $table->text('customer_complaint')->nullable();
            $table->string('signature_file', 255)->nullable();
            $table->string('key_tag_number', 30)->nullable();
            
            $table->foreignId('checked_in_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamp('checked_in_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_checkins');
    }
};