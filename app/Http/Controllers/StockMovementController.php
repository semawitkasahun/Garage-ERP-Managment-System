<?php

namespace App\Http\Controllers;

use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = StockMovement::query()->with(['item', 'branch', 'movedBy']);

        if ($request->has('item_id')) {
            $query->where('item_id', $request->item_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->has('from_date')) {
            $query->whereDate('moved_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('moved_at', '<=', $request->to_date);
        }

        return $query->latest('moved_at')
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'movement_type' => 'required|string|max:20',
            'quantity' => 'required|numeric|min:0.01',
            'reference_type' => 'nullable|string|max:30',
            'reference_id' => 'nullable|integer',
            'moved_by' => 'required|integer|exists:users,user_id',
        ]);

        $movement = StockMovement::create($validated);
        return response()->json($movement, 201);
    }

    public function show(StockMovement $stockMovement)
    {
        return $stockMovement->load(['item', 'branch', 'movedBy']);
    }

    public function update(Request $request, StockMovement $stockMovement)
    {
        $validated = $request->validate([
            'quantity' => 'nullable|numeric|min:0.01',
            'reference_type' => 'nullable|string|max:30',
            'reference_id' => 'nullable|integer',
        ]);

        $stockMovement->update($validated);
        return $stockMovement;
    }

    public function destroy(StockMovement $stockMovement)
    {
        $stockMovement->delete();
        return response()->noContent();
    }

    public function getByItem($itemId)
    {
        $movements = StockMovement::where('item_id', $itemId)
            ->with(['branch', 'movedBy'])
            ->latest('moved_at')
            ->get();
        return $movements;
    }

    public function getByBranch($branchId)
    {
        $movements = StockMovement::where('branch_id', $branchId)
            ->with(['item', 'movedBy'])
            ->latest('moved_at')
            ->get();
        return $movements;
    }

    public function getByReference($referenceType, $referenceId)
    {
        $movements = StockMovement::where('reference_type', $referenceType)
            ->where('reference_id', $referenceId)
            ->with(['item', 'branch', 'movedBy'])
            ->get();
        return $movements;
    }

    public function getSummary(Request $request)
    {
        $query = StockMovement::query();

        if ($request->has('from_date')) {
            $query->whereDate('moved_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('moved_at', '<=', $request->to_date);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        $summary = [
            'total_movements' => $query->count(),
            'by_type' => $query->select('movement_type', \DB::raw('count(*) as count'), \DB::raw('sum(quantity) as total_quantity'))
                ->groupBy('movement_type')
                ->get(),
            'total_quantity_in' => $query->where('movement_type', 'receipt')->sum('quantity'),
            'total_quantity_out' => $query->where('movement_type', 'issue')->sum('quantity'),
        ];

        return $summary;
    }
}