<?php

namespace App\Http\Controllers;

use App\Models\SalesOrderItem;
use Illuminate\Http\Request;

class SalesOrderItemController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrderItem::query()->with(['salesOrder', 'item']);

        if ($request->has('sales_order_id')) {
            $query->where('sales_order_id', $request->sales_order_id);
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
            'sales_order_id' => 'required|integer|exists:sales_orders,sales_order_id',
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'line_total' => 'required|numeric|min:0',
        ]);

        $item = SalesOrderItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(SalesOrderItem $salesOrderItem)
    {
        return $salesOrderItem->load(['salesOrder', 'item']);
    }

    public function update(Request $request, SalesOrderItem $salesOrderItem)
    {
        $validated = $request->validate([
            'quantity' => 'nullable|numeric|min:0.01',
            'unit_price' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'line_total' => 'nullable|numeric|min:0',
        ]);

        $salesOrderItem->update($validated);
        return $salesOrderItem;
    }

    public function destroy(SalesOrderItem $salesOrderItem)
    {
        $salesOrderItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|integer|exists:sales_orders,sales_order_id',
            'items' => 'required|array',
            'items.*.item_id' => 'required|integer|exists:inventory_items,item_id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'required|numeric|min:0',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['sales_order_id'] = $validated['sales_order_id'];
            $createdItems[] = SalesOrderItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getBySalesOrder($salesOrderId)
    {
        $items = SalesOrderItem::where('sales_order_id', $salesOrderId)
            ->with(['item'])
            ->get();
        return $items;
    }
}