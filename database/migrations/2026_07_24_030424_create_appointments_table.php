<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id('appointment_id');
            
            $table->foreignId('customer_id')
                ->constrained('customers', 'customer_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); //if the customer is deleted, the appointment should remain for record purposes
            
            $table->foreignId('vehicle_id')
                ->constrained('vehicles', 'vehicle_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); //if the vehicle is deleted, the appointment should remain for record purposes
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();//if the branch is deleted, the appointment should remain for record purposes
            
            $table->foreignId('bay_id')
                ->constrained('bays', 'bay_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();//if the bay is deleted, the appointment should remain for record purposes
            
            $table->foreignId('technician_id')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();//if the technician is deleted, the appointment should remain for record purposes
            
            $table->string('service_type', 50)->nullable();
            $table->timestamp('scheduled_start')->nullable(false);
            $table->timestamp('scheduled_end')->nullable();
            $table->string('status', 20)->nullable();
            $table->boolean('is_walkin')->default(false);
            $table->timestamps();
            
            $table->index('scheduled_start');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};