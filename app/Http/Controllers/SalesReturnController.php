<?php

namespace App\Http\Controllers;

use App\Models\SalesReturn;
use Illuminate\Http\Request;

class SalesReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesReturn::query()->with(['salesOrder']);

        if ($request->has('sales_order_id')) {
            $query->where('sales_order_id', $request->sales_order_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sales_order_id' => 'required|integer|exists:sales_orders,sales_order_id',
            'reason' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:20',
        ]);

        $return = SalesReturn::create($validated);
        return response()->json($return, 201);
    }

    public function show(SalesReturn $salesReturn)
    {
        return $salesReturn->load([
            'salesOrder',
            'items' => function ($query) {
                $query->with(['item']);
            }
        ]);
    }

    public function update(Request $request, SalesReturn $salesReturn)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'reason' => 'nullable|string|max:255',
        ]);

        $salesReturn->update($validated);
        return $salesReturn;
    }

    public function destroy(SalesReturn $salesReturn)
    {
        if ($salesReturn->status === 'processed') {
            return response()->json([
                'message' => 'Cannot delete processed return'
            ], 422);
        }

        $salesReturn->delete();
        return response()->noContent();
    }

    public function approve(SalesReturn $salesReturn)
    {
        $salesReturn->update(['status' => 'approved']);
        return $salesReturn;
    }

    public function process(SalesReturn $salesReturn)
    {
        // Update inventory stock
        foreach ($salesReturn->items as $item) {
            $stock = $item->item->stock()
                ->where('branch_id', $salesReturn->salesOrder->branch_id)
                ->first();

            if ($stock) {
                $stock->increment('quantity_on_hand', $item->quantity_returned);
            }
        }

        $salesReturn->update(['status' => 'processed']);
        return $salesReturn;
    }

    public function getBySalesOrder($salesOrderId)
    {
        $returns = SalesReturn::where('sales_order_id', $salesOrderId)
            ->with(['items'])
            ->latest()
            ->get();
        return $returns;
    }

    public function getPending()
    {
        $returns = SalesReturn::where('status', 'pending')
            ->with(['salesOrder'])
            ->latest()
            ->get();
        return $returns;
    }
}