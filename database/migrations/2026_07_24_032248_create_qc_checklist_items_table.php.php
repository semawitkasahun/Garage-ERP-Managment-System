<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('qc_checklist_items', function (Blueprint $table) {
            $table->id('qc_item_id');
            
            $table->foreignId('qc_id')
                ->constrained('quality_control_checks', 'qc_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->string('item_name', 100)->nullable();
            $table->string('status', 20)->nullable();
            $table->string('notes', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qc_checklist_items');
    }
};