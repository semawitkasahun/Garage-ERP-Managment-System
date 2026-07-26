<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use App\Models\StockTransfer;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::query()->with(['supplier', 'branch', 'approvedBy']);

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('order_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('order_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'requisition_id' => 'nullable|integer|exists:purchase_requisitions,requisition_id',
            'status' => 'nullable|string|max:20',
            'order_date' => 'nullable|date',
            'expected_date' => 'nullable|date|after:order_date',
            'freight_cost' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
        ]);

        $order = PurchaseOrder::create($validated);
        return response()->json($order, 201);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return $purchaseOrder->load([
            'supplier',
            'branch',
            'requisition',
            'approvedBy',
            'items' => function ($query) {
                $query->with(['item']);
            },
            'goodsReceivedNotes' => function ($query) {
                $query->with(['receivedBy', 'items']);
            },
            'returns'
        ]);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'expected_date' => 'nullable|date|after:order_date',
            'freight_cost' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
        ]);

        $purchaseOrder->update($validated);
        return $purchaseOrder;
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status === 'approved' || $purchaseOrder->status === 'sent') {
            return response()->json([
                'message' => 'Cannot delete approved or sent purchase order'
            ], 422);
        }

        $purchaseOrder->delete();
        return response()->noContent();
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'approved_by' => 'required|integer|exists:users,user_id',
        ]);

        $purchaseOrder->update([
            'status' => 'approved',
            'approved_by' => $validated['approved_by'],
        ]);
        return $purchaseOrder;
    }

    public function send(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->update(['status' => 'sent']);
        // Send email to supplier
        return $purchaseOrder;
    }

    public function receive(StockTransfer $stockTransfer)
    {
        // Update stock quantities
        // Deduct from source branch
        $sourceStock = $stockTransfer->item->stock()
            ->where('branch_id', $stockTransfer->from_branch_id)
            ->first();

        if ($sourceStock && $sourceStock->quantity_on_hand >= $stockTransfer->quantity) {
            $sourceStock->decrement('quantity_on_hand', (float) $stockTransfer->quantity);
        } else {
            return response()->json([
                'message' => 'Insufficient stock at source branch'
            ], 422);
        }

        // Add to destination branch
        $destStock = $stockTransfer->item->stock()
            ->where('branch_id', $stockTransfer->to_branch_id)
            ->first();

        if ($destStock) {
            $destStock->increment('quantity_on_hand', (float) $stockTransfer->quantity);
        } else {
            $stockTransfer->item->stock()->create([
                'branch_id' => $stockTransfer->to_branch_id,
                'quantity_on_hand' => $stockTransfer->quantity,
                'quantity_reserved' => 0,
            ]);
        }

        $stockTransfer->update([
            'status' => 'completed',
            'transferred_at' => now(),
        ]);

        return $stockTransfer;
    }

    public function getBySupplier($supplierId)
    {
        $orders = PurchaseOrder::where('supplier_id', $supplierId)
            ->with(['branch', 'items'])
            ->latest()
            ->get();
        return $orders;
    }

    public function getPending()
    {
        $orders = PurchaseOrder::where('status', 'pending')
            ->with(['supplier', 'branch'])
            ->latest()
            ->get();
        return $orders;
    }

    public function getSummary()
    {
        $summary = [
            'total_orders' => PurchaseOrder::count(),
            'by_status' => PurchaseOrder::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'total_value' => PurchaseOrder::sum('total_amount'),
            'pending_approval' => PurchaseOrder::where('status', 'pending')->count(),
            'orders_this_month' => PurchaseOrder::whereMonth('order_date', now()->month)->count(),
        ];
        return $summary;
    }
}