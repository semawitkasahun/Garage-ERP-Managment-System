<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;

class PurchaseOrderItemController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrderItem::query()->with(['purchaseOrder', 'item']);

        if ($request->has('po_id')) {
            $query->where('po_id', $request->po_id);
        }

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'po_id' => 'required|integer|exists:purchase_orders,po_id',
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'quantity_ordered' => 'required|numeric|min:0.01',
            'unit_cost' => 'required|numeric|min:0',
            'quantity_received' => 'nullable|numeric|min:0',
        ]);

        $item = PurchaseOrderItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(PurchaseOrderItem $purchaseOrderItem)
    {
        return $purchaseOrderItem->load(['purchaseOrder', 'item']);
    }

    public function update(Request $request, PurchaseOrderItem $purchaseOrderItem)
    {
        $validated = $request->validate([
            'quantity_ordered' => 'nullable|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'quantity_received' => 'nullable|numeric|min:0',
        ]);

        $purchaseOrderItem->update($validated);
        return $purchaseOrderItem;
    }

    public function destroy(PurchaseOrderItem $purchaseOrderItem)
    {
        $purchaseOrderItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'po_id' => 'required|integer|exists:purchase_orders,po_id',
            'items' => 'required|array',
            'items.*.item_id' => 'required|integer|exists:inventory_items,item_id',
            'items.*.quantity_ordered' => 'required|numeric|min:0.01',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['po_id'] = $validated['po_id'];
            $createdItems[] = PurchaseOrderItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function receive(Request $request, PurchaseOrderItem $purchaseOrderItem)
    {
        $validated = $request->validate([
            'quantity_received' => 'required|numeric|min:0.01|max:' . ($purchaseOrderItem->quantity_ordered - $purchaseOrderItem->quantity_received),
        ]);

        $purchaseOrderItem->increment('quantity_received', $validated['quantity_received']);
        return $purchaseOrderItem;
    }

    public function getByPurchaseOrder($poId)
    {
        $items = PurchaseOrderItem::where('po_id', $poId)
            ->with(['item'])
            ->get();
        return $items;
    }
}