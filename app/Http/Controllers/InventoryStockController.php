<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use Illuminate\Http\Request;

class InventoryStockController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryStock::query()->with(['item', 'branch']);

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('min_quantity')) {
            $query->where('quantity_on_hand', '>=', $request->min_quantity);
        }

        if ($request->has('max_quantity')) {
            $query->where('quantity_on_hand', '<=', $request->max_quantity);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'quantity_on_hand' => 'nullable|numeric|min:0',
            'quantity_reserved' => 'nullable|numeric|min:0',
        ]);

        $stock = InventoryStock::create($validated);
        return response()->json($stock, 201);
    }

    public function show(InventoryStock $inventoryStock)
    {
        return $inventoryStock->load(['item', 'branch']);
    }

    public function update(Request $request, InventoryStock $inventoryStock)
    {
        $validated = $request->validate([
            'quantity_on_hand' => 'nullable|numeric|min:0',
            'quantity_reserved' => 'nullable|numeric|min:0',
        ]);

        $inventoryStock->update($validated);
        return $inventoryStock;
    }

    public function destroy(InventoryStock $inventoryStock)
    {
        $inventoryStock->delete();
        return response()->noContent();
    }

    public function adjust(Request $request, InventoryStock $inventoryStock)
    {
        $validated = $request->validate([
            'adjustment' => 'required|numeric',
            'reason' => 'required|string',
        ]);

        $newQuantity = $inventoryStock->quantity_on_hand + $validated['adjustment'];

        if ($newQuantity < 0) {
            return response()->json([
                'message' => 'Adjustment would result in negative stock'
            ], 422);
        }

        $inventoryStock->update([
            'quantity_on_hand' => $newQuantity,
        ]);

        // Log the movement
        $inventoryStock->item->movements()->create([
            'branch_id' => $inventoryStock->branch_id,
            'movement_type' => $validated['adjustment'] >= 0 ? 'adjustment' : 'adjustment',
            'quantity' => abs($validated['adjustment']),
            'reference_type' => 'stock_adjustment',
            'reference_id' => $inventoryStock->stock_id,
            'moved_by' => auth()->id(),
            'moved_at' => now(),
        ]);

        return $inventoryStock;
    }

    public function reserve(Request $request, InventoryStock $inventoryStock)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
        ]);

        $available = $inventoryStock->quantity_on_hand - $inventoryStock->quantity_reserved;

        if ($validated['quantity'] > $available) {
            return response()->json([
                'message' => 'Insufficient available stock',
                'available' => $available,
                'requested' => $validated['quantity']
            ], 422);
        }

        $inventoryStock->increment('quantity_reserved', $validated['quantity']);
        return $inventoryStock;
    }

    public function release(Request $request, InventoryStock $inventoryStock)
    {
        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
        ]);

        if ($validated['quantity'] > $inventoryStock->quantity_reserved) {
            return response()->json([
                'message' => 'Cannot release more than reserved',
                'reserved' => $inventoryStock->quantity_reserved,
                'requested' => $validated['quantity']
            ], 422);
        }

        $inventoryStock->decrement('quantity_reserved', $validated['quantity']);
        return $inventoryStock;
    }

    public function getByItem($itemId)
    {
        $stock = InventoryStock::where('item_id', $itemId)
            ->with(['branch'])
            ->get();
        return $stock;
    }

    public function getByBranch($branchId)
    {
        $stock = InventoryStock::where('branch_id', $branchId)
            ->with(['item'])
            ->get();
        return $stock;
    }
}