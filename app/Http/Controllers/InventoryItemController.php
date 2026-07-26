<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('sku', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('min_price')) {
            $query->where('sell_price', '>=', $request->min_price);
        }

        if ($request->has('max_price')) {
            $query->where('sell_price', '<=', $request->max_price);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:50|unique:inventory_items,sku',
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'unit_of_measure' => 'nullable|string|max:20',
            'cost_price' => 'nullable|numeric|min:0',
            'sell_price' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'is_serialized' => 'sometimes|boolean',
            'is_batch_tracked' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        $item = InventoryItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(InventoryItem $inventoryItem)
    {
        return $inventoryItem->load([
            'stock' => function ($query) {
                $query->with(['branch']);
            },
            'batches',
            'movements' => function ($query) {
                $query->latest()->limit(10);
            },
            'transfers',
            'supplierPriceListItems' => function ($query) {
                $query->with(['priceList.supplier']);
            }
        ]);
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $validated = $request->validate([
            'sku' => 'sometimes|required|string|max:50|unique:inventory_items,sku,' . $inventoryItem->item_id . ',item_id',
            'name' => 'sometimes|required|string|max:150',
            'description' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'unit_of_measure' => 'nullable|string|max:20',
            'cost_price' => 'nullable|numeric|min:0',
            'sell_price' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'is_serialized' => 'sometimes|boolean',
            'is_batch_tracked' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        $inventoryItem->update($validated);
        return $inventoryItem;
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        // Check if item has stock
        if ($inventoryItem->stock()->sum('quantity_on_hand') > 0) {
            return response()->json([
                'message' => 'Cannot delete item with existing stock'
            ], 422);
        }

        $inventoryItem->delete();
        return response()->noContent();
    }

    public function getLowStock()
    {
        $items = InventoryItem::with(['stock'])
            ->whereHas('stock', function ($query) {
                $query->whereColumn('quantity_on_hand', '<=', 'reorder_point');
            })
            ->get();

        return $items;
    }

    public function getByCategory($category)
    {
        $items = InventoryItem::where('category', $category)
            ->with(['stock'])
            ->get();
        return $items;
    }

    public function getStockSummary($id)
    {
        $item = InventoryItem::with(['stock' => function ($query) {
            $query->with(['branch']);
        }])->findOrFail($id);

        $totalStock = $item->stock->sum('quantity_on_hand');
        $totalReserved = $item->stock->sum('quantity_reserved');
        $available = $totalStock - $totalReserved;

        return response()->json([
            'item' => $item,
            'total_stock' => $totalStock,
            'total_reserved' => $totalReserved,
            'available' => $available,
            'by_branch' => $item->stock,
        ]);
    }
}