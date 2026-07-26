<?php

namespace App\Http\Controllers;

use App\Models\GrnItem;
use Illuminate\Http\Request;

class GrnItemController extends Controller
{
    public function index(Request $request)
    {
        $query = GrnItem::query()->with(['goodsReceivedNote', 'purchaseOrderItem', 'item']);

        if ($request->has('grn_id')) {
            $query->where('grn_id', $request->grn_id);
        }

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('condition')) {
            $query->where('condition', $request->condition);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'grn_id' => 'required|integer|exists:goods_received_notes,grn_id',
            'po_item_id' => 'required|integer|exists:purchase_order_items,po_item_id',
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'quantity_received' => 'required|numeric|min:0.01',
            'batch_or_serial_no' => 'nullable|string|max:50',
            'condition' => 'nullable|string|max:20',
        ]);

        $item = GrnItem::create($validated);

        // Update inventory stock
        $this->updateInventoryStock($item);

        return response()->json($item, 201);
    }

    public function show(GrnItem $grnItem)
    {
        return $grnItem->load(['goodsReceivedNote', 'purchaseOrderItem', 'item']);
    }

    public function update(Request $request, GrnItem $grnItem)
    {
        $validated = $request->validate([
            'condition' => 'nullable|string|max:20',
        ]);

        $grnItem->update($validated);
        return $grnItem;
    }

    public function destroy(GrnItem $grnItem)
    {
        $grnItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'grn_id' => 'required|integer|exists:goods_received_notes,grn_id',
            'items' => 'required|array',
            'items.*.po_item_id' => 'required|integer|exists:purchase_order_items,po_item_id',
            'items.*.item_id' => 'required|integer|exists:inventory_items,item_id',
            'items.*.quantity_received' => 'required|numeric|min:0.01',
            'items.*.batch_or_serial_no' => 'nullable|string|max:50',
            'items.*.condition' => 'nullable|string|max:20',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['grn_id'] = $validated['grn_id'];
            $item = GrnItem::create($itemData);
            $this->updateInventoryStock($item);
            $createdItems[] = $item;
        }

        return response()->json($createdItems, 201);
    }

    private function updateInventoryStock($item)
    {
        $stock = $item->item->stock()
            ->where('branch_id', $item->goodsReceivedNote->branch_id)
            ->first();

        if ($stock) {
            $stock->increment('quantity_on_hand', $item->quantity_received);
        } else {
            $item->item->stock()->create([
                'branch_id' => $item->goodsReceivedNote->branch_id,
                'quantity_on_hand' => $item->quantity_received,
                'quantity_reserved' => 0,
            ]);
        }

        // Update purchase order item
        $item->purchaseOrderItem->increment('quantity_received', $item->quantity_received);
    }

    public function getByGrn($grnId)
    {
        $items = GrnItem::where('grn_id', $grnId)
            ->with(['item', 'purchaseOrderItem'])
            ->get();
        return $items;
    }

    public function getDamaged()
    {
        $items = GrnItem::where('condition', 'damaged')
            ->with(['goodsReceivedNote', 'item'])
            ->latest()
            ->get();
        return $items;
    }
}