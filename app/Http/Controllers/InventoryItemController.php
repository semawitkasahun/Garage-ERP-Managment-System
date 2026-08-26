<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::with(['stock', 'supplier']);

        if ($request->has('category') && $request->category !== '') {
            $query->where('category', $request->category);
        }

        if ($request->has('storage_location') && $request->storage_location !== '') {
            $query->where('storage_location', 'like', '%' . $request->storage_location . '%');
        }

        if ($request->has('supplier_id') && $request->supplier_id !== '') {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('sku', 'like', '%' . $search . '%')
                  ->orWhere('part_number', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by Stock Status
        if ($request->has('status') && $request->status !== '') {
            $status = $request->status;
            if ($status === 'out_of_stock') {
                $query->whereDoesntHave('stock')
                      ->orWhereHas('stock', function ($q) {
                          $q->select(DB::raw('SUM(quantity_on_hand)'))->havingRaw('SUM(quantity_on_hand) <= 0');
                      });
            } elseif ($status === 'low_stock') {
                $query->whereHas('stock', function ($q) {
                    $q->whereColumn('quantity_on_hand', '<=', 'inventory_items.reorder_point')
                      ->where('quantity_on_hand', '>', 0);
                });
            } elseif ($status === 'in_stock') {
                $query->whereHas('stock', function ($q) {
                    $q->whereColumn('quantity_on_hand', '>', 'inventory_items.reorder_point');
                });
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:50|unique:inventory_items,sku',
            'name' => 'required|string|max:150',
            'part_number' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'unit_of_measure' => 'nullable|string|max:20',
            'cost_price' => 'nullable|numeric|min:0',
            'sell_price' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'storage_location' => 'nullable|string|max:100',
            'supplier_id' => 'nullable|integer|exists:suppliers,supplier_id',
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
            'part_number' => 'nullable|string|max:100',
            'description' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:50',
            'unit_of_measure' => 'nullable|string|max:20',
            'cost_price' => 'nullable|numeric|min:0',
            'sell_price' => 'nullable|numeric|min:0',
            'reorder_point' => 'nullable|numeric|min:0',
            'storage_location' => 'nullable|string|max:100',
            'supplier_id' => 'nullable|integer|exists:suppliers,supplier_id',
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