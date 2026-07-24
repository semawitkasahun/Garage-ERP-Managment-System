<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkin_media', function (Blueprint $table) {
            $table->id('media_id');
            
            $table->foreignId('checkin_id')
                ->constrained('vehicle_checkins', 'checkin_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->string('file_path', 255)->nullable(false);
            $table->string('media_type', 10)->nullable();
            $table->timestamp('captured_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkin_media');
    }
};