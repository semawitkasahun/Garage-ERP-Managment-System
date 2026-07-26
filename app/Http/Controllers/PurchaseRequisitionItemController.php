<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequisitionItem;
use Illuminate\Http\Request;

class PurchaseRequisitionItemController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseRequisitionItem::query()->with(['requisition', 'item']);

        if ($request->has('requisition_id')) {
            $query->where('requisition_id', $request->requisition_id);
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
            'requisition_id' => 'required|integer|exists:purchase_requisitions,requisition_id',
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'quantity_requested' => 'required|numeric|min:0.01',
        ]);

        $item = PurchaseRequisitionItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(PurchaseRequisitionItem $purchaseRequisitionItem)
    {
        return $purchaseRequisitionItem->load(['requisition', 'item']);
    }

    public function update(Request $request, PurchaseRequisitionItem $purchaseRequisitionItem)
    {
        $validated = $request->validate([
            'quantity_requested' => 'nullable|numeric|min:0.01',
        ]);

        $purchaseRequisitionItem->update($validated);
        return $purchaseRequisitionItem;
    }

    public function destroy(PurchaseRequisitionItem $purchaseRequisitionItem)
    {
        $purchaseRequisitionItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'requisition_id' => 'required|integer|exists:purchase_requisitions,requisition_id',
            'items' => 'required|array',
            'items.*.item_id' => 'required|integer|exists:inventory_items,item_id',
            'items.*.quantity_requested' => 'required|numeric|min:0.01',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['requisition_id'] = $validated['requisition_id'];
            $createdItems[] = PurchaseRequisitionItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getByRequisition($requisitionId)
    {
        $items = PurchaseRequisitionItem::where('requisition_id', $requisitionId)
            ->with(['item'])
            ->get();
        return $items;
    }
}