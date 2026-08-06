<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('leads', function (Blueprint $table) {
            if (!Schema::hasColumn('leads', 'name')) {
                $table->string('name', 150)->nullable()->after('lead_id');
            }
            if (!Schema::hasColumn('leads', 'company')) {
                $table->string('company', 150)->nullable()->after('name');
            }
            if (!Schema::hasColumn('leads', 'phone')) {
                $table->string('phone', 30)->nullable()->after('company');
            }
            if (!Schema::hasColumn('leads', 'email')) {
                $table->string('email', 100)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('leads', 'address')) {
                $table->string('address', 255)->nullable()->after('email');
            }
            if (!Schema::hasColumn('leads', 'interested_service')) {
                $table->string('interested_service', 100)->nullable()->after('address');
            }
            if (!Schema::hasColumn('leads', 'expected_budget')) {
                $table->decimal('expected_budget', 12, 2)->nullable()->after('interested_service');
            }
            if (!Schema::hasColumn('leads', 'preferred_contact_method')) {
                $table->string('preferred_contact_method', 20)->nullable()->after('expected_budget');
            }
            if (!Schema::hasColumn('leads', 'priority')) {
                $table->string('priority', 10)->default('medium')->after('preferred_contact_method');
            }
            if (!Schema::hasColumn('leads', 'notes')) {
                $table->text('notes')->nullable()->after('priority');
            }
            if (!Schema::hasColumn('leads', 'vehicle_make')) {
                $table->string('vehicle_make', 50)->nullable()->after('notes');
            }
            if (!Schema::hasColumn('leads', 'vehicle_model')) {
                $table->string('vehicle_model', 50)->nullable()->after('vehicle_make');
            }
            if (!Schema::hasColumn('leads', 'vehicle_year')) {
                $table->integer('vehicle_year')->nullable()->after('vehicle_model');
            }
            if (!Schema::hasColumn('leads', 'vehicle_plate')) {
                $table->string('vehicle_plate', 20)->nullable()->after('vehicle_year');
            }
            if (!Schema::hasColumn('leads', 'vehicle_vin')) {
                $table->string('vehicle_vin', 50)->nullable()->after('vehicle_plate');
            }
            if (!Schema::hasColumn('leads', 'interest_level')) {
                $table->string('interest_level', 20)->nullable()->after('vehicle_vin');
            }
            if (!Schema::hasColumn('leads', 'urgency')) {
                $table->string('urgency', 20)->nullable()->after('interest_level');
            }
            if (!Schema::hasColumn('leads', 'is_decision_maker')) {
                $table->boolean('is_decision_maker')->nullable()->after('urgency');
            }
            if (!Schema::hasColumn('leads', 'expected_service_date')) {
                $table->date('expected_service_date')->nullable()->after('is_decision_maker');
            }
        });
    }

    public function down()
    {
        Schema::table('leads', function (Blueprint $table) {
            $cols = [
                'name', 'company', 'phone', 'email', 'address', 'interested_service',
                'expected_budget', 'preferred_contact_method', 'priority', 'notes',
                'vehicle_make', 'vehicle_model', 'vehicle_year', 'vehicle_plate', 'vehicle_vin',
                'interest_level', 'urgency', 'is_decision_maker', 'expected_service_date',
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
