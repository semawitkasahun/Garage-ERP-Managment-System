<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Enhance equipment table
        Schema::table('equipment', function (Blueprint $table) {
            if (!Schema::hasColumn('equipment', 'description')) {
                $table->text('description')->nullable()->after('serial_number');
            }
        });

        // Make condition and status flexible
        Schema::table('equipment', function (Blueprint $table) {
            $table->string('condition', 50)->nullable()->default(null)->change();
            $table->string('status', 50)->default('Available')->change();
        });

        // 2. Create equipment_histories table
        if (!Schema::hasTable('equipment_histories')) {
            Schema::create('equipment_histories', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('equipment_id');
                $table->string('event_type', 50); // registered, qr_generated, updated, status_changed, condition_changed, checkout, checkin, maintenance, retired, missing
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('performed_by')->nullable();
                $table->json('metadata')->nullable();
                $table->dateTime('event_date');
                $table->timestamps();

                $table->foreign('equipment_id')->references('id')->on('equipment')->onDelete('cascade');
                $table->index(['equipment_id', 'event_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_histories');
        Schema::table('equipment', function (Blueprint $table) {
            if (Schema::hasColumn('equipment', 'description')) {
                $table->dropColumn('description');
            }
        });
    }
};
