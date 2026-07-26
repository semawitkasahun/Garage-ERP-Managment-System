<?php

namespace App\Http\Controllers;

use App\Models\PurchaseReturn;
use Illuminate\Http\Request;

class PurchaseReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseReturn::query()->with(['purchaseOrder', 'supplier']);

        if ($request->has('po_id')) {
            $query->where('po_id', $request->po_id);
        }

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
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
            'po_id' => 'required|integer|exists:purchase_orders,po_id',
            'supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'reason' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:20',
        ]);

        $return = PurchaseReturn::create($validated);
        return response()->json($return, 201);
    }

    public function show(PurchaseReturn $purchaseReturn)
    {
        return $purchaseReturn->load([
            'purchaseOrder',
            'supplier',
            'items' => function ($query) {
                $query->with(['item']);
            }
        ]);
    }

    public function update(Request $request, PurchaseReturn $purchaseReturn)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'reason' => 'nullable|string|max:255',
        ]);

        $purchaseReturn->update($validated);
        return $purchaseReturn;
    }

    public function destroy(PurchaseReturn $purchaseReturn)
    {
        if ($purchaseReturn->status === 'approved') {
            return response()->json([
                'message' => 'Cannot delete approved return'
            ], 422);
        }

        $purchaseReturn->delete();
        return response()->noContent();
    }

    public function approve(PurchaseReturn $purchaseReturn)
    {
        $purchaseReturn->update(['status' => 'approved']);
        return $purchaseReturn;
    }

    public function process(PurchaseReturn $purchaseReturn)
    {
        // Update inventory stock
        foreach ($purchaseReturn->items as $item) {
            $stock = $item->item->stock()
                ->where('branch_id', $purchaseReturn->purchaseOrder->branch_id)
                ->first();

            if ($stock) {
                $stock->decrement('quantity_on_hand', $item->quantity_returned);
            }
        }

        $purchaseReturn->update(['status' => 'processed']);
        return $purchaseReturn;
    }

    public function getBySupplier($supplierId)
    {
        $returns = PurchaseReturn::where('supplier_id', $supplierId)
            ->with(['purchaseOrder', 'items'])
            ->latest()
            ->get();
        return $returns;
    }

    public function getPending()
    {
        $returns = PurchaseReturn::where('status', 'pending')
            ->with(['supplier', 'purchaseOrder'])
            ->latest()
            ->get();
        return $returns;
    }
}