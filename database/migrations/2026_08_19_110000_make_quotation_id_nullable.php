<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            // Make quotation_id nullable to allow work orders before quotations
            $table->foreignId('quotation_id')
                ->nullable()
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('work_orders', function (Blueprint $table) {
            // Revert to make quotation_id required
            $table->foreignId('quotation_id')
                ->constrained('quotations', 'quotation_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete()
                ->change();
        });
    }
};