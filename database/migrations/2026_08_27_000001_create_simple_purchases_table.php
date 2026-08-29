<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('simple_purchases', function (Blueprint $table) {
            $table->id('purchase_id');

            $table->string('purchase_number', 20)->unique()->nullable(false);

            $table->foreignId('supplier_id')
                ->constrained('suppliers', 'supplier_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->date('purchase_date')->nullable(false);
            $table->string('invoice_reference', 100)->nullable();

            $table->enum('payment_status', ['paid', 'partial', 'unpaid'])->default('unpaid');
            $table->decimal('amount_paid', 12, 2)->default(0);
            $table->decimal('total_amount', 12, 2)->default(0);

            $table->text('notes')->nullable();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users', 'user_id')
                ->nullOnDelete();

            $table->timestamps();

            $table->index('supplier_id');
            $table->index('payment_status');
            $table->index('purchase_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('simple_purchases');
    }
};
