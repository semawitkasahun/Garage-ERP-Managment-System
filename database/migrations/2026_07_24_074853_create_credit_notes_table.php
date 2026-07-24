<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_notes', function (Blueprint $table) {
            $table->id('credit_note_id');
            
            $table->foreignId('invoice_id')
                ->constrained('invoices', 'invoice_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to invoices table when invoice is deleted, restrict the deletion
            
            $table->string('reason', 255)->nullable();
            $table->decimal('amount', 12, 2)->nullable(false);
            
            $table->foreignId('created_by')
                ->constrained('users', 'user_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to users table when user is deleted, restrict the deletion if the user is deleted all credit notes created by that user will be deleted
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_notes');
    }
};