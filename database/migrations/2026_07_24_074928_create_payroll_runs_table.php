<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id('payroll_run_id');
            
            $table->foreignId('branch_id')
                ->constrained('branches', 'branch_id')
                ->cascadeOnUpdate()
                ->restrictOnDelete();// Foreign key to branches table whene branch is deleted, restrict the deletion if the branch has associated payroll runs then the branch cannot be deleted if the payroll run is deleted then the branch can be deleted
            
            $table->date('period_start')->nullable(false);
            $table->date('period_end')->nullable(false);
            $table->string('status', 20)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_runs');
    }
};