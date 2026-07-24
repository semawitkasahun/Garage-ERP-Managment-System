<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_contracts', function (Blueprint $table) {
            $table->id('contract_id');
            
            $table->foreignId('supplier_id')
                ->constrained('suppliers', 'supplier_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); // Foreign key to suppliers table when supplier is deleted, delete the contract
            
            $table->foreignId('document_id')
                ->constrained('documents', 'document_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete(); // Foreign key to documents table when document is deleted, restrict the deletion
            
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_contracts');
    }
};