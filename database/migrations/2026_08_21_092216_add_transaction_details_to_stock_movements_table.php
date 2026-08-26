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
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->string('transaction_number', 50)->nullable()->after('movement_id');
            $table->decimal('previous_quantity', 12, 2)->nullable()->after('quantity');
            $table->decimal('new_quantity', 12, 2)->nullable()->after('previous_quantity');
            $table->string('notes', 255)->nullable()->after('reference_id');
            $table->foreignId('target_branch_id')->nullable()->after('branch_id')->constrained('branches', 'branch_id')->nullOnDelete();
            $table->foreignId('authorized_by')->nullable()->after('moved_by')->constrained('users', 'user_id')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropForeign(['target_branch_id']);
            $table->dropForeign(['authorized_by']);
            $table->dropColumn(['transaction_number', 'previous_quantity', 'new_quantity', 'notes', 'target_branch_id', 'authorized_by']);
        });
    }
};
