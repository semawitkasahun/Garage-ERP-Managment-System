<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id('quotation_item_id');
            
            $table->foreignId('quotation_id')
                ->constrained('quotations', 'quotation_id')
                ->cascadeOnUpdate()
                ->cascadeOnDelete(); //if the quotation is deleted, the items should also be deleted
            
            $table->foreignId('finding_id')
                ->nullable()
                ->constrained('inspection_findings', 'finding_id')
                ->cascadeOnUpdate()
                ->nullOnDelete(); //if the finding is deleted, the quotation item should remain for record purposes
            
            $table->string('item_type', 10)->nullable(false);
            $table->integer('inventory_item_id')->nullable();
            $table->string('description', 255)->nullable(false);
            $table->decimal('quantity', 10, 2)->nullable();
            $table->decimal('unit_price', 12, 2)->nullable(false);
            $table->decimal('tax_amount', 12, 2)->nullable();
            $table->decimal('discount_amount', 12, 2)->nullable();
            $table->decimal('line_total', 12, 2)->nullable(false);
            $table->string('approval_status', 20)->nullable();
            $table->string('approved_via', 20)->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index('approval_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
    }
};