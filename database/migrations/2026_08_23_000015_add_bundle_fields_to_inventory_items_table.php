<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::table('inventory_items', function (Blueprint $table) {
      if (!Schema::hasColumn('inventory_items', 'item_code')) {
        $table->string('item_code')->nullable()->unique()->after('item_id');
      }
      if (!Schema::hasColumn('inventory_items', 'brand')) {
        $table->string('brand')->nullable()->after('name');
      }
      if (!Schema::hasColumn('inventory_items', 'unit')) {
        $table->string('unit', 20)->nullable()->after('unit_of_measure');
      }
      if (!Schema::hasColumn('inventory_items', 'current_quantity')) {
        $table->decimal('current_quantity', 12, 2)->default(0)->after('unit');
      }
      if (!Schema::hasColumn('inventory_items', 'minimum_stock')) {
        $table->decimal('minimum_stock', 12, 2)->default(0)->after('current_quantity');
      }
      if (!Schema::hasColumn('inventory_items', 'reorder_quantity')) {
        $table->decimal('reorder_quantity', 12, 2)->default(0)->after('minimum_stock');
      }
      if (!Schema::hasColumn('inventory_items', 'unit_cost')) {
        $table->decimal('unit_cost', 12, 2)->default(0)->after('reorder_quantity');
      }
      if (!Schema::hasColumn('inventory_items', 'selling_price')) {
        $table->decimal('selling_price', 12, 2)->nullable()->after('unit_cost');
      }
      if (!Schema::hasColumn('inventory_items', 'storage_location_id')) {
        $table->unsignedBigInteger('storage_location_id')->nullable()->after('storage_location');
      }
      if (!Schema::hasColumn('inventory_items', 'status')) {
        $table->string('status', 30)->default('In Stock')->after('is_active');
      }
      if (!Schema::hasColumn('inventory_items', 'notes')) {
        $table->text('notes')->nullable()->after('status');
      }
    });
  }

  public function down(): void
  {
    Schema::table('inventory_items', function (Blueprint $table) {
      foreach (['item_code', 'brand', 'unit', 'current_quantity', 'minimum_stock', 'reorder_quantity', 'unit_cost', 'selling_price', 'storage_location_id', 'status', 'notes'] as $column) {
        if (Schema::hasColumn('inventory_items', $column)) {
          $table->dropColumn($column);
        }
      }
    });
  }
};
