<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix duplicate work order numbers by resetting numbering sequence
        $maxWorkOrderId = DB::table('work_orders')->max('work_order_id');
        
        // Update or create numbering sequence
        $existingSequence = DB::table('numbering_sequences')
            ->where('entity_type', 'work_orders')
            ->first();
        
        if ($existingSequence) {
            DB::table('numbering_sequences')
                ->where('entity_type', 'work_orders')
                ->update([
                    'next_number' => $maxWorkOrderId + 1,
                ]);
        } else {
            DB::table('numbering_sequences')->insert([
                'entity_type' => 'work_orders',
                'prefix' => 'WO',
                'next_number' => $maxWorkOrderId + 1,
            ]);
        }
        
        // Fix any work orders that might have duplicate numbers
        $workOrders = DB::table('work_orders')->get();
        $usedNumbers = [];
        
        foreach ($workOrders as $workOrder) {
            if (in_array($workOrder->work_order_number, $usedNumbers)) {
                // Generate new unique number
                $newNumber = 'WO-' . str_pad($workOrder->work_order_id, 5, '0', STR_PAD_LEFT);
                DB::table('work_orders')
                    ->where('work_order_id', $workOrder->work_order_id)
                    ->update(['work_order_number' => $newNumber]);
                $usedNumbers[] = $newNumber;
            } else {
                $usedNumbers[] = $workOrder->work_order_number;
            }
        }
    }

    public function down(): void
    {
        // Revert changes is complex, so we'll just reset the sequence
        DB::table('numbering_sequences')
            ->where('entity_type', 'work_orders')
            ->delete();
    }
};