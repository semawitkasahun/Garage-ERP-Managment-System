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
        Schema::table('attendance', function (Blueprint $table) {
            // Detailed time tracking
            $table->timestamp('break_start')->nullable();
            $table->timestamp('break_end')->nullable();
            $table->time('scheduled_start')->nullable();
            $table->time('scheduled_end')->nullable();
            
            // Calculated fields for payroll
            $table->integer('late_minutes')->default(0);
            $table->integer('early_departure_minutes')->default(0);
            $table->decimal('total_worked_hours', 5, 2)->default(0);
            $table->decimal('overtime_hours', 5, 2)->default(0);
            $table->decimal('break_hours', 5, 2)->default(0);
            
            // Notes
            $table->text('notes')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance', function (Blueprint $table) {
            $table->dropColumn([
                'break_start',
                'break_end',
                'scheduled_start',
                'scheduled_end',
                'late_minutes',
                'early_departure_minutes',
                'total_worked_hours',
                'overtime_hours',
                'break_hours',
                'notes'
            ]);
        });
    }
};
