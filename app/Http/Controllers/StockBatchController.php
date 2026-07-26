<?php

namespace App\Http\Controllers;

use App\Models\StockBatch;
use Illuminate\Http\Request;

class StockBatchController extends Controller
{
    public function index(Request $request)
    {
        $query = StockBatch::query()->with(['item', 'branch']);

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('batch_or_serial_no')) {
            $query->where('batch_or_serial_no', 'like', '%' . $request->batch_or_serial_no . '%');
        }

        if ($request->has('expiry_before')) {
            $query->where('expiry_date', '<=', $request->expiry_before);
        }

        if ($request->has('expiry_after')) {
            $query->where('expiry_date', '>=', $request->expiry_after);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'batch_or_serial_no' => 'nullable|string|max:50',
            'quantity' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date|after:today',
        ]);

        $batch = StockBatch::create($validated);
        return response()->json($batch, 201);
    }

    public function show(StockBatch $stockBatch)
    {
        return $stockBatch->load(['item', 'branch']);
    }

    public function update(Request $request, StockBatch $stockBatch)
    {
        $validated = $request->validate([
            'quantity' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date|after:today',
        ]);

        $stockBatch->update($validated);
        return $stockBatch;
    }

    public function destroy(StockBatch $stockBatch)
    {
        if ($stockBatch->quantity > 0) {
            return response()->json([
                'message' => 'Cannot delete batch with remaining quantity'
            ], 422);
        }

        $stockBatch->delete();
        return response()->noContent();
    }

    public function getByItem($itemId)
    {
        $batches = StockBatch::where('item_id', $itemId)
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->get();
        return $batches;
    }

    public function getExpiringSoon($days = 30)
    {
        $batches = StockBatch::where('quantity', '>', 0)
            ->where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>=', now())
            ->with(['item', 'branch'])
            ->orderBy('expiry_date', 'asc')
            ->get();
        return $batches;
    }

    public function getExpired()
    {
        $batches = StockBatch::where('quantity', '>', 0)
            ->where('expiry_date', '<', now())
            ->with(['item', 'branch'])
            ->orderBy('expiry_date', 'asc')
            ->get();
        return $batches;
    }

    public function consume(Request $request, StockBatch $stockBatch)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01|max:' . $stockBatch->quantity,
        ]);

        $stockBatch->decrement('quantity', $validated['quantity']);
        return $stockBatch;
    }
}