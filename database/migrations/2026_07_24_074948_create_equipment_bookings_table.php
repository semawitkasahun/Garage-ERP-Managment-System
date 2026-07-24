<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_bookings', function (Blueprint $table) {
            $table->id('booking_id');
            
            $table->foreignId('asset_id')
                ->constrained('assets', 'asset_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// the equipment being booked if the asset is deleted, restrict deletion then the booking cannot be deleted if the asset is deleted then the booking can be deleted if the booking is deleted then the asset can be deleted
            $table->foreignId('booked_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // the user who booked the equipment if the user is deleted, restrict deletion then the booking cannot be deleted if the user is deleted then the booking can be deleted if the booking is deleted then the user can be deleted
            
            $table->foreignId('job_card_id')
                ->nullable()
                ->constrained('job_cards', 'job_card_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();// the job card associated with the booking if the job card is deleted, set job_card_id to null then the booking can still exist if the booking is deleted then the job card can be deleted
            
            $table->timestamp('start_time')->nullable(false);
            $table->timestamp('end_time')->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamps();
            
            $table->index('start_time');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_bookings');
    }
};