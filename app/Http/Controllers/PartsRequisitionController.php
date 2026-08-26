<?php

namespace App\Http\Controllers;

use App\Models\PartsRequisition;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\StockMovement;
use App\Models\JobCardPart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartsRequisitionController extends Controller
{
    public function index(Request $request)
    {
        $query = PartsRequisition::query()->with(['jobCard', 'task', 'inventoryItem', 'requestedBy']);

        if ($request->has('job_card_id')) {
            $query->where('job_card_id', $request->job_card_id);
        }

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|integer|exists:job_cards,job_card_id',
            'task_id' => 'nullable|integer|exists:job_card_tasks,task_id',
            'inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
            'quantity_requested' => 'required|numeric|min:0.01',
            'quantity_issued' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
            'requested_by' => 'required|integer|exists:users,user_id',
        ]);

        $requisition = PartsRequisition::create($validated);
        return response()->json($requisition, 201);
    }

    public function show(PartsRequisition $partsRequisition)
    {
        return $partsRequisition->load([
            'jobCard',
            'task',
            'inventoryItem',
            'requestedBy'
        ]);
    }

    public function update(Request $request, PartsRequisition $partsRequisition)
    {
        $validated = $request->validate([
            'quantity_requested' => 'nullable|numeric|min:0.01',
            'quantity_issued' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
        ]);

        $partsRequisition->update($validated);
        return $partsRequisition;
    }

    public function destroy(PartsRequisition $partsRequisition)
    {
        $partsRequisition->delete();
        return response()->noContent();
    }

    public function approve(PartsRequisition $partsRequisition)
    {
        $partsRequisition->update(['status' => 'approved']);
        return response()->json([
            'message' => 'Parts requisition approved successfully.',
            'requisition' => $partsRequisition->load(['jobCard', 'inventoryItem'])
        ]);
    }

    public function issue(Request $request, PartsRequisition $partsRequisition)
    {
        $validated = $request->validate([
            'quantity_issued' => 'nullable|numeric|min:0.01',
        ]);

        $quantityToIssue = $validated['quantity_issued'] ?? $partsRequisition->quantity_requested;
        $branchId = $request->user()?->branch_id ?? 1;

        if ($partsRequisition->status === 'issued') {
            return response()->json(['message' => 'This parts requisition has already been issued.'], 422);
        }

        $item = InventoryItem::find($partsRequisition->inventory_item_id);
        if (!$item) {
            return response()->json(['message' => 'Inventory item not found.'], 404);
        }

        return DB::transaction(function () use ($partsRequisition, $quantityToIssue, $branchId, $item, $request) {
            // Find inventory stock
            $stock = InventoryStock::where('item_id', $item->item_id)
                ->where('branch_id', $branchId)
                ->first();

            $prevQty = $stock ? (float) $stock->quantity_on_hand : 0.0;

            if ($prevQty < $quantityToIssue) {
                return response()->json([
                    'message' => "Insufficient stock. Available: {$prevQty} {$item->unit_of_measure}, requested to issue: {$quantityToIssue} {$item->unit_of_measure}."
                ], 422);
            }

            // Decrement Stock
            $stock->decrement('quantity_on_hand', $quantityToIssue);
            $newQty = $prevQty - $quantityToIssue;

            // Log Stock Movement (Audited Transaction)
            $txnNumber = 'TXN-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
            StockMovement::create([
                'transaction_number' => $txnNumber,
                'item_id' => $item->item_id,
                'branch_id' => $branchId,
                'movement_type' => 'issue',
                'quantity' => $quantityToIssue,
                'previous_quantity' => $prevQty,
                'new_quantity' => $newQty,
                'reference_type' => 'parts_requisition',
                'reference_id' => $partsRequisition->requisition_id,
                'notes' => "Issued {$quantityToIssue} {$item->unit_of_measure} to Job Card #{$partsRequisition->job_card_id}",
                'moved_by' => $request->user()?->user_id ?? 1,
                'moved_at' => now(),
            ]);

            // Link to Job Card Parts
            $jobCardPart = JobCardPart::updateOrCreate(
                [
                    'job_card_id' => $partsRequisition->job_card_id,
                    'inventory_item_id' => $item->item_id,
                ],
                [
                    'part_name' => $item->name,
                    'requested_quantity' => $partsRequisition->quantity_requested,
                    'issued_quantity' => DB::raw("COALESCE(issued_quantity, 0) + {$quantityToIssue}"),
                    'used_quantity' => DB::raw("COALESCE(used_quantity, 0) + {$quantityToIssue}"),
                    'unit_cost' => $item->cost_price ?? 0,
                    'total_cost' => DB::raw("COALESCE(total_cost, 0) + (" . ($item->cost_price ?? 0) . " * {$quantityToIssue})"),
                ]
            );

            // Recalculate Job Card Costs
            $jobCard = $partsRequisition->jobCard;
            if ($jobCard) {
                // Update parts cost
                $partsCost = JobCardPart::where('job_card_id', $jobCard->job_card_id)->sum('total_cost');
                $jobCard->parts_cost = $partsCost;
                $jobCard->estimated_total_cost = ($jobCard->labor_cost ?? 0) + $partsCost + ($jobCard->other_cost ?? 0);
                $jobCard->save();
            }

            // Update Requisition
            $partsRequisition->update([
                'status' => 'issued',
                'quantity_issued' => $quantityToIssue,
            ]);

            return response()->json([
                'message' => 'Parts requisition issued successfully and stock updated.',
                'requisition' => $partsRequisition->load(['jobCard', 'inventoryItem']),
                'job_card_part' => $jobCardPart
            ]);
        });
    }

    public function reject(PartsRequisition $partsRequisition)
    {
        $partsRequisition->update(['status' => 'rejected']);
        return response()->json([
            'message' => 'Parts requisition rejected.',
            'requisition' => $partsRequisition->load(['jobCard', 'inventoryItem'])
        ]);
    }

    public function getByJobCard($jobCardId)
    {
        $requisitions = PartsRequisition::where('job_card_id', $jobCardId)
            ->with(['inventoryItem', 'requestedBy'])
            ->latest()
            ->get();
        return $requisitions;
    }

    public function getByTask($taskId)
    {
        $requisitions = PartsRequisition::where('task_id', $taskId)
            ->with(['inventoryItem', 'requestedBy'])
            ->latest()
            ->get();
        return $requisitions;
    }

    public function getPending()
    {
        $requisitions = PartsRequisition::where('status', 'pending')
            ->with(['jobCard', 'inventoryItem'])
            ->latest()
            ->get();
        return $requisitions;
    }
}