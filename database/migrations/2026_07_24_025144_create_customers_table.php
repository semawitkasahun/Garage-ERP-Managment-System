<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id('customer_id');
            $table->string('customer_type', 20)->nullable();
            $table->string('first_name', 150)->nullable(false);
            $table->string('last_name', 150)->nullable(false);
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('segment', 30)->nullable();

            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->boolean('opt_in_sms')->default(false);
            $table->boolean('opt_in_email')->default(false);
            $table->timestamps();

            $table->index('phone');
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};