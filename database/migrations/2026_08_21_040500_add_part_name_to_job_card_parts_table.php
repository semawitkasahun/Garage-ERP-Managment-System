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
        Schema::table('job_card_parts', function (Blueprint $table) {
            if (!Schema::hasColumn('job_card_parts', 'part_name')) {
                $table->string('part_name')->nullable()->after('inventory_item_id');
            }
        });

        // Make inventory_item_id nullable for custom part entries
        Schema::table('job_card_parts', function (Blueprint $table) {
            $table->unsignedBigInteger('inventory_item_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_parts', function (Blueprint $table) {
            if (Schema::hasColumn('job_card_parts', 'part_name')) {
                $table->dropColumn('part_name');
            }
        });
    }
};
