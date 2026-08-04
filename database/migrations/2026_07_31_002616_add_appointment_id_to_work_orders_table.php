<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('work_orders', 'appointment_id')) {
                $table->foreignId('appointment_id')
                    ->nullable()
                    ->after('quotation_id')
                    ->constrained('appointments', 'appointment_id')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            if (Schema::hasColumn('work_orders', 'appointment_id')) {
                $table->dropForeign(['appointment_id']);
                $table->dropColumn('appointment_id');
            }
        });
    }
};