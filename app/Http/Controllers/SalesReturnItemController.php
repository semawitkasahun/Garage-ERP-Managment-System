<?php

namespace App\Http\Controllers;

use App\Models\SalesReturnItem;
use Illuminate\Http\Request;

class SalesReturnItemController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesReturnItem::query()->with(['salesReturn', 'item']);

        if ($request->has('sales_return_id')) {
            $query->where('sales_return_id', $request->sales_return_id);
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
            'sales_return_id' => 'required|integer|exists:sales_returns,sales_return_id',
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'quantity_returned' => 'required|numeric|min:0.01',
        ]);

        $item = SalesReturnItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(SalesReturnItem $salesReturnItem)
    {
        return $salesReturnItem->load(['salesReturn', 'item']);
    }

    public function update(Request $request, SalesReturnItem $salesReturnItem)
    {
        $validated = $request->validate([
            'quantity_returned' => 'nullable|numeric|min:0.01',
        ]);

        $salesReturnItem->update($validated);
        return $salesReturnItem;
    }

    public function destroy(SalesReturnItem $salesReturnItem)
    {
        $salesReturnItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'sales_return_id' => 'required|integer|exists:sales_returns,sales_return_id',
            'items' => 'required|array',
            'items.*.item_id' => 'required|integer|exists:inventory_items,item_id',
            'items.*.quantity_returned' => 'required|numeric|min:0.01',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['sales_return_id'] = $validated['sales_return_id'];
            $createdItems[] = SalesReturnItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getBySalesReturn($salesReturnId)
    {
        $items = SalesReturnItem::where('sales_return_id', $salesReturnId)
            ->with(['item'])
            ->get();
        return $items;
    }
}