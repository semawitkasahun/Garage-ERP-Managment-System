<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_findings', function (Blueprint $table) {
            $table->id('finding_id');
            
            $table->foreignId('inspection_id')
                ->constrained('inspections', 'inspection_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); //if the inspection is deleted, the finding should also be deleted
            
            $table->text('description')->nullable(false);
            $table->string('classification', 20)->nullable(false);
            $table->string('photo_path', 255)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_findings');
    }
};