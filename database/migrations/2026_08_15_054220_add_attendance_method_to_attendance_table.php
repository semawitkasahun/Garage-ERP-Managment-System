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
        Schema::table('attendance', function (Blueprint $table) {
            $table->enum('check_in_method', ['qr', 'manual', 'biometric', 'other'])->nullable()->after('clock_in');
            $table->enum('check_out_method', ['qr', 'manual', 'biometric', 'other'])->nullable()->after('clock_out');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn(['check_in_method', 'check_out_method']);
        });
    }
};
