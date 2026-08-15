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
        Schema::table('employee_shifts', function (Blueprint $table) {
            // Weekly schedule - each day can have a different shift or be null (off)
            $table->foreignId('monday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
            $table->foreignId('tuesday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
            $table->foreignId('wednesday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
            $table->foreignId('thursday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
            $table->foreignId('friday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
            $table->foreignId('saturday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
            $table->foreignId('sunday_shift_id')->nullable()->constrained('shifts', 'shift_id')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_shifts', function (Blueprint $table) {
            $table->dropForeign(['monday_shift_id']);
            $table->dropForeign(['tuesday_shift_id']);
            $table->dropForeign(['wednesday_shift_id']);
            $table->dropForeign(['thursday_shift_id']);
            $table->dropForeign(['friday_shift_id']);
            $table->dropForeign(['saturday_shift_id']);
            $table->dropForeign(['sunday_shift_id']);
            $table->dropColumn([
                'monday_shift_id',
                'tuesday_shift_id',
                'wednesday_shift_id',
                'thursday_shift_id',
                'friday_shift_id',
                'saturday_shift_id',
                'sunday_shift_id',
            ]);
        });
    }
};
