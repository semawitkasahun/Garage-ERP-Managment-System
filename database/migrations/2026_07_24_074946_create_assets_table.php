<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id('asset_id');
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('name', 150)->nullable(false);
            $table->string('category', 50)->nullable(); // lift, diagnostic_tool, general_tool
            $table->date('purchase_date')->nullable();
            $table->decimal('purchase_cost', 12, 2)->nullable();
            $table->string('depreciation_method', 30)->nullable();
            $table->integer('useful_life_years')->nullable();
            $table->decimal('current_value', 12, 2)->nullable();
            $table->string('status', 20)->nullable();
            $table->timestamps();
            
            $table->index('category');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};