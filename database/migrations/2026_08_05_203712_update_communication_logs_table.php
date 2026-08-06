<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('communication_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('customer_id')->nullable()->change();
            if (!Schema::hasColumn('communication_logs', 'lead_id')) {
                $table->foreignId('lead_id')->nullable()->after('customer_id')->constrained('leads', 'lead_id')->onDelete('cascade');
            }
        });
    }

    public function down()
    {
        Schema::table('communication_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('lead_id');
        });
    }
};
