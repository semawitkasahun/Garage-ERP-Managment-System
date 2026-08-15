<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update existing records to use standardized statuses
        DB::statement("UPDATE attendance SET status = 'half_day' WHERE status = 'early_departure'");
        DB::statement("UPDATE attendance SET status = 'on_leave' WHERE status = 'off'");
        
        // Modify the existing status column to use standardized enum
        DB::statement("ALTER TABLE attendance MODIFY COLUMN status ENUM('present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'rest_day', 'early_departure', 'overtime', 'off_duty') NOT NULL DEFAULT 'present'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to string type
        DB::statement("ALTER TABLE attendance MODIFY COLUMN status VARCHAR(20) NULL");
    }
};
