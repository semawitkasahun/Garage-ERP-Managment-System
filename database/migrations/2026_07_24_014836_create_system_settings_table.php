<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id('setting_id');
            
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            
            $table->string('setting_key', 100)->nullable(false);
            $table->string('setting_value', 255)->nullable();
            $table->timestamps();
            
            $table->unique(['branch_id', 'setting_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};