<?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use Illuminate\Http\Request;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrder::query()->with(['customer', 'branch', 'createdBy']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
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
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'status' => 'nullable|string|max:20',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'created_by' => 'required|integer|exists:users,user_id',
        ]);

        $order = SalesOrder::create($validated);
        return response()->json($order, 201);
    }

    public function show(SalesOrder $salesOrder)
    {
        return $salesOrder->load([
            'customer',
            'branch',
            'createdBy',
            'items' => function ($query) {
                $query->with(['item']);
            },
            'returns'
        ]);
    }

    public function update(Request $request, SalesOrder $salesOrder)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'discount_amount' => 'nullable|numeric|min:0',
        ]);

        $salesOrder->update($validated);
        return $salesOrder;
    }

    public function destroy(SalesOrder $salesOrder)
    {
        if ($salesOrder->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed order'
            ], 422);
        }

        $salesOrder->delete();
        return response()->noContent();
    }

    public function getByCustomer($customerId)
    {
        $orders = SalesOrder::where('customer_id', $customerId)
            ->with(['branch', 'items'])
            ->latest()
            ->get();
        return $orders;
    }

    public function getPending()
    {
        $orders = SalesOrder::where('status', 'pending')
            ->with(['customer', 'branch'])
            ->latest()
            ->get();
        return $orders;
    }

    public function getSummary()
    {
        $summary = [
            'total_orders' => SalesOrder::count(),
            'by_status' => SalesOrder::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'total_value' => SalesOrder::sum('total_amount'),
            'orders_this_month' => SalesOrder::whereMonth('order_date', now()->month)->count(),
        ];
        return $summary;
    }
}