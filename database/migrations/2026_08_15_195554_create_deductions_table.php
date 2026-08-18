<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deductions', function (Blueprint $table) {
            $table->id('deduction_id');
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            
            $table->string('name')->comment('Tax, Pension, Loan, etc.');
            $table->string('code')->unique()->comment('Unique code like "TAX", "PENS", "LOAN"');
            $table->text('description')->nullable();
            
            // Amount configuration
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('calculation_type')->default('fixed')->comment('fixed, percentage_of_basic, percentage_of_gross, percentage_of_taxable');
            $table->decimal('percentage_value', 5, 2)->nullable()->comment('Percentage value if calculation type is percentage');
            
            // Priority for deduction order
            $table->integer('priority')->default(0)->comment('Higher priority deductions are applied first');
            
            // Deduction type
            $table->string('deduction_type')->default('standard')->comment('standard, tax, pension, loan, advance, other');
            
            // Applicability
            $table->boolean('applies_to_all')->default(true);
            $table->json('applicable_employee_ids')->nullable()->comment('Array of employee IDs if not applies_to_all');
            $table->json('applicable_department_ids')->nullable()->comment('Array of department IDs');
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('is_active');
            $table->index('code');
            $table->index('priority');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deductions');
    }
};
