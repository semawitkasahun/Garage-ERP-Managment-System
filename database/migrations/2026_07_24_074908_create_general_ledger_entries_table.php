<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('general_ledger_entries', function (Blueprint $table) {
            $table->id('gl_entry_id');
            
            $table->foreignId('account_id')
                ->constrained('chart_of_accounts', 'account_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to chart_of_accounts table when account is deleted, restrict the deletion
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to branches table whene branch is deleted, restrict the deletion
            
            $table->string('reference_type', 30)->nullable(); // invoice, payment, expense, po, payroll
            $table->integer('reference_id')->nullable();
            $table->decimal('debit', 14, 2)->nullable();
            $table->decimal('credit', 14, 2)->nullable();
            $table->date('entry_date')->nullable();
            
            $table->foreignId('created_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->timestamps();
            
            $table->index(['reference_type', 'reference_id']);
            $table->index('entry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('general_ledger_entries');
    }
};