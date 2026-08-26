<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::table('equipment_checkouts', function (Blueprint $table) {
      $table->unsignedBigInteger('work_order_id')->nullable()->after('equipment_id');
      $table->unsignedBigInteger('job_card_id')->nullable()->after('work_order_id');
      $table->unsignedBigInteger('equipment_request_id')->nullable()->after('job_card_id');
      $table->string('closed_reason')->nullable()->after('return_notes');
      $table->json('return_photos')->nullable()->after('closed_reason');
    });

    Schema::table('equipment_maintenance_logs', function (Blueprint $table) {
      $table->json('photos')->nullable()->after('next_due_at');
    });

    Schema::table('equipment', function (Blueprint $table) {
      $table->string('checkout_qr_code')->unique()->after('qr_code');
    });
  }

  public function down(): void
  {
    Schema::table('equipment', function (Blueprint $table) {
      $table->dropUnique(['checkout_qr_code']);
      $table->dropColumn('checkout_qr_code');
    });

    Schema::table('equipment_maintenance_logs', function (Blueprint $table) {
      $table->dropColumn('photos');
    });

    Schema::table('equipment_checkouts', function (Blueprint $table) {
      $table->dropColumn(['work_order_id', 'job_card_id', 'equipment_request_id', 'closed_reason', 'return_photos']);
    });
  }
};
