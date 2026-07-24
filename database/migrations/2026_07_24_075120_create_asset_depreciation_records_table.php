<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_depreciation_records', function (Blueprint $table) {
            $table->id('record_id');
            
            $table->foreignId('asset_id')
                ->constrained('assets', 'asset_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // if an asset is deleted, its depreciation records should also be deleted
            
            $table->string('period', 20)->nullable();
            $table->decimal('depreciation_amount', 12, 2)->nullable();
            $table->decimal('book_value', 12, 2)->nullable();
            $table->timestamps();
            
            $table->index('period');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_depreciation_records');
    }
};