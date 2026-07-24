<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('communication_logs', function (Blueprint $table) {
            $table->id('comm_id');

            $table->foreignId('customer_id')
                ->constrained('customers', 'customer_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreignId('created_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('channel', 20)->nullable();
            $table->string('direction', 10)->nullable();
            $table->string('subject', 150)->nullable();
            $table->text('content')->nullable();

            // ✅ Only ONE created_at - use timestamps() OR manual, not both
            $table->timestamps(); // This creates created_at AND updated_at

            // Remove this line:
            // $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('communication_logs');
    }
};