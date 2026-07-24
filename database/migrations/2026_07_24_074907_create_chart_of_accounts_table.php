<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->id('account_id');
            $table->string('code', 20)->unique()->nullable(false);
            $table->string('name', 150)->nullable(false);
            $table->string('account_type', 20)->nullable(false); // asset, liability, equity, revenue, expense
            
            $table->foreignId('parent_account_id')
                ->nullable()
                ->constrained('chart_of_accounts', 'account_id')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            
            $table->timestamps();
            
            $table->index('account_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};