<?php

namespace App\Http\Controllers;

use App\Models\StockTransfer;
use Illuminate\Http\Request;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        $query = StockTransfer::query()->with(['item', 'fromBranch', 'toBranch', 'requestedBy']);

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('from_branch_id')) {
            $query->where('from_branch_id', $request->from_branch_id);
        }

        if ($request->has('to_branch_id')) {
            $query->where('to_branch_id', $request->to_branch_id);
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
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'from_branch_id' => 'required|integer|exists:branches,branch_id',
            'to_branch_id' => 'required|integer|exists:branches,branch_id|different:from_branch_id',
            'quantity' => 'required|numeric|min:0.01',
            'status' => 'nullable|string|max:20',
            'requested_by' => 'required|integer|exists:users,user_id',
        ]);

        $transfer = StockTransfer::create($validated);
        return response()->json($transfer, 201);
    }

    public function show(StockTransfer $stockTransfer)
    {
        return $stockTransfer->load(['item', 'fromBranch', 'toBranch', 'requestedBy']);
    }

    public function update(Request $request, StockTransfer $stockTransfer)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
        ]);

        $stockTransfer->update($validated);
        return $stockTransfer;
    }

    public function destroy(StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed transfer'
            ], 422);
        }

        $stockTransfer->delete();
        return response()->noContent();
    }

    public function approve(StockTransfer $stockTransfer)
    {
        $stockTransfer->update(['status' => 'approved']);
        return $stockTransfer;
    }

    public function complete(StockTransfer $stockTransfer)
    {
        // Update stock quantities
        // Deduct from source branch
        $sourceStock = $stockTransfer->item->stock()
            ->where('branch_id', $stockTransfer->from_branch_id)
            ->first();

        if ($sourceStock && $sourceStock->quantity_on_hand >= $stockTransfer->quantity) {
            $sourceStock->decrement('quantity_on_hand', (float) $stockTransfer->quantity);
        } else {
            return response()->json([
                'message' => 'Insufficient stock at source branch'
            ], 422);
        }

        // Add to destination branch
        $destStock = $stockTransfer->item->stock()
            ->where('branch_id', $stockTransfer->to_branch_id)
            ->first();

        if ($destStock) {
            $destStock->increment('quantity_on_hand', (float) $stockTransfer->quantity);
        } else {
            $stockTransfer->item->stock()->create([
                'branch_id' => $stockTransfer->to_branch_id,
                'quantity_on_hand' => $stockTransfer->quantity,
                'quantity_reserved' => 0,
            ]);
        }

        $stockTransfer->update([
            'status' => 'completed',
            'transferred_at' => now(),
        ]);

        return $stockTransfer;
    }

    public function cancel(StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status === 'completed') {
            return response()->json([
                'message' => 'Cannot cancel completed transfer'
            ], 422);
        }

        $stockTransfer->update(['status' => 'cancelled']);
        return $stockTransfer;
    }

    public function getByItem($itemId)
    {
        $transfers = StockTransfer::where('item_id', $itemId)
            ->with(['fromBranch', 'toBranch', 'requestedBy'])
            ->latest()
            ->get();
        return $transfers;
    }

    public function getByBranch($branchId)
    {
        $transfers = StockTransfer::where('from_branch_id', $branchId)
            ->orWhere('to_branch_id', $branchId)
            ->with(['item', 'fromBranch', 'toBranch'])
            ->latest()
            ->get();
        return $transfers;
    }

    public function getPending()
    {
        $transfers = StockTransfer::where('status', 'pending')
            ->with(['item', 'fromBranch', 'toBranch', 'requestedBy'])
            ->latest()
            ->get();
        return $transfers;
    }
}