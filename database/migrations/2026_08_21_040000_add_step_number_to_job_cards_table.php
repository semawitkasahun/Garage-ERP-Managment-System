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
        Schema::table('job_cards', function (Blueprint $table) {
            if (!Schema::hasColumn('job_cards', 'step_number')) {
                $table->integer('step_number')->default(1)->after('work_order_id');
            }
            if (!Schema::hasColumn('job_cards', 'service_category')) {
                $table->string('service_category', 100)->nullable()->after('job_title');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            if (Schema::hasColumn('job_cards', 'service_category')) {
                $table->dropColumn('service_category');
            }
            if (Schema::hasColumn('job_cards', 'step_number')) {
                $table->dropColumn('step_number');
            }
        });
    }
};
