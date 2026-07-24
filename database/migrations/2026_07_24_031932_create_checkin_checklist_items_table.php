<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkin_checklist_items', function (Blueprint $table) {
            $table->id('item_id');
            
            $table->foreignId('checkin_id')
                ->constrained('vehicle_checkins', 'checkin_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); //if the checkin is deleted, the checklist items should also be deleted
            
            $table->string('item_name', 100)->nullable();
            $table->string('status', 20)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkin_checklist_items');
    }
};