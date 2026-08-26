<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\WorkOrder;
use App\Models\NumberingSequence;

echo "Checking existing work orders...\n";
$workOrders = WorkOrder::select('work_order_id', 'work_order_number')->get();
foreach ($workOrders as $wo) {
    echo "ID: {$wo->work_order_id}, Number: {$wo->work_order_number}\n";
}

echo "\nChecking numbering sequence...\n";
$sequence = NumberingSequence::where('entity_type', 'work_orders')->first();
if ($sequence) {
    echo "Sequence found with next_number: {$sequence->next_number}\n";
} else {
    echo "No sequence found for work_orders\n";
}

echo "\nChecking for duplicate WO-00001...\n";
$duplicate = WorkOrder::where('work_order_number', 'WO-00001')->first();
if ($duplicate) {
    echo "Found duplicate work order WO-00001 with ID: {$duplicate->work_order_id}\n";
    echo "Deleting duplicate...\n";
    $duplicate->delete();
    echo "Duplicate deleted\n";
} else {
    echo "No duplicate found\n";
}

echo "\nUpdating numbering sequence...\n";
$sequence = NumberingSequence::where('entity_type', 'work_orders')->first();
if ($sequence) {
    $maxNumber = WorkOrder::max('work_order_id');
    $sequence->next_number = $maxNumber + 1;
    $sequence->save();
    echo "Sequence updated to next_number: {$sequence->next_number}\n";
} else {
    echo "Creating new sequence...\n";
    NumberingSequence::create([
        'entity_type' => 'work_orders',
        'prefix' => 'WO',
        'next_number' => 1,
    ]);
    echo "New sequence created\n";
}

echo "\nDone\n";