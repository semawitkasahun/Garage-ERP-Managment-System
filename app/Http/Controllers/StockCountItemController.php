<?php

namespace App\Http\Controllers;

use App\Models\StockCountItem;
use Illuminate\Http\Request;

class StockCountItemController extends Controller
{
    public function index(Request $request)
    {
        $query = StockCountItem::query()->with(['stockCount', 'item']);

        if ($request->has('count_id')) {
            $query->where('count_id', $request->count_id);
        }

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('has_variance')) {
            $query->whereRaw('ABS(variance) > 0');
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'count_id' => 'required|integer|exists:stock_counts,count_id',
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'system_qty' => 'nullable|numeric|min:0',
            'counted_qty' => 'nullable|numeric|min:0',
        ]);

        // Calculate variance
        if (isset($validated['system_qty']) && isset($validated['counted_qty'])) {
            $validated['variance'] = $validated['counted_qty'] - $validated['system_qty'];
        }

        $item = StockCountItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(StockCountItem $stockCountItem)
    {
        return $stockCountItem->load(['stockCount', 'item']);
    }

    public function update(Request $request, StockCountItem $stockCountItem)
    {
        $validated = $request->validate([
            'counted_qty' => 'nullable|numeric|min:0',
        ]);

        if (isset($validated['counted_qty'])) {
            $validated['variance'] = $validated['counted_qty'] - $stockCountItem->system_qty;
        }

        $stockCountItem->update($validated);
        return $stockCountItem;
    }

    public function destroy(StockCountItem $stockCountItem)
    {
        $stockCountItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'count_id' => 'required|integer|exists:stock_counts,count_id',
            'items' => 'required|array',
            'items.*.item_id' => 'required|integer|exists:inventory_items,item_id',
            'items.*.system_qty' => 'nullable|numeric|min:0',
            'items.*.counted_qty' => 'nullable|numeric|min:0',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['count_id'] = $validated['count_id'];
            if (isset($itemData['system_qty']) && isset($itemData['counted_qty'])) {
                $itemData['variance'] = $itemData['counted_qty'] - $itemData['system_qty'];
            }
            $createdItems[] = StockCountItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getByCount($countId)
    {
        $items = StockCountItem::where('count_id', $countId)
            ->with(['item'])
            ->get();
        return $items;
    }

    public function getVariances($countId)
    {
        $items = StockCountItem::where('count_id', $countId)
            ->whereRaw('ABS(variance) > 0')
            ->with(['item'])
            ->get();
        return $items;
    }

    public function adjustStock(StockCountItem $stockCountItem)
    {
        if ($stockCountItem->variance == 0) {
            return response()->json([
                'message' => 'No variance to adjust'
            ], 422);
        }

        // Update inventory stock
        $stock = $stockCountItem->stockCount->branch
            ->stock()
            ->where('item_id', $stockCountItem->item_id)
            ->first();

        if ($stock) {
            $stock->increment('quantity_on_hand', $stockCountItem->variance);
        }

        // Log the adjustment
        $stockCountItem->stockCount->branch->item->movements()->create([
            'branch_id' => $stockCountItem->stockCount->branch_id,
            'movement_type' => 'adjustment',
            'quantity' => abs((float) $stockCountItem->variance),
            'reference_type' => 'stock_count',
            'reference_id' => $stockCountItem->count_id,
            'moved_by' => auth()->id(),
            'moved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Stock adjusted successfully',
            'variance' => $stockCountItem->variance,
        ]);
    }
}