<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_reconciliations', function (Blueprint $table) {
            $table->id('reconciliation_id');
            
            $table->foreignId('bank_account_id')
                ->constrained('bank_accounts', 'bank_account_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->date('statement_date')->nullable();
            $table->decimal('statement_balance', 14, 2)->nullable();
            $table->decimal('book_balance', 14, 2)->nullable();
            
            $table->foreignId('reconciled_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamp('reconciled_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliations');
    }
};