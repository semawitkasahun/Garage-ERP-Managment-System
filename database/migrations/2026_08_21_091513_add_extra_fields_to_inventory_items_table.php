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
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->string('part_number', 100)->nullable()->after('name');
            $table->string('storage_location', 100)->nullable()->after('reorder_point');
            $table->foreignId('supplier_id')->nullable()->after('section_id')->constrained('suppliers', 'supplier_id')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->dropColumn(['part_number', 'storage_location', 'supplier_id']);
        });
    }
};
