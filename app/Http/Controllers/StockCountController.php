<?php

namespace App\Http\Controllers;

use App\Models\StockCount;
use Illuminate\Http\Request;

class StockCountController extends Controller
{
    public function index(Request $request)
    {
        $query = StockCount::query()->with(['branch']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('scheduled_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('scheduled_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'status' => 'nullable|string|max:20',
            'scheduled_date' => 'nullable|date',
        ]);

        $count = StockCount::create($validated);
        return response()->json($count, 201);
    }

    public function show(StockCount $stockCount)
    {
        return $stockCount->load([
            'branch',
            'items' => function ($query) {
                $query->with(['item']);
            }
        ]);
    }

    public function update(Request $request, StockCount $stockCount)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'scheduled_date' => 'nullable|date',
        ]);

        $stockCount->update($validated);
        return $stockCount;
    }

    public function destroy(StockCount $stockCount)
    {
        if ($stockCount->status === 'completed') {
            return response()->json([
                'message' => 'Cannot delete completed stock count'
            ], 422);
        }

        $stockCount->delete();
        return response()->noContent();
    }

    public function start(StockCount $stockCount)
    {
        $stockCount->update(['status' => 'in_progress']);
        return $stockCount;
    }

    public function complete(StockCount $stockCount)
    {
        $stockCount->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
        return $stockCount;
    }

    public function getByBranch($branchId)
    {
        $counts = StockCount::where('branch_id', $branchId)
            ->with(['items'])
            ->latest()
            ->get();
        return $counts;
    }

    public function getPending()
    {
        $counts = StockCount::where('status', 'pending')
            ->with(['branch'])
            ->latest()
            ->get();
        return $counts;
    }

    public function getSummary()
    {
        $summary = [
            'total' => StockCount::count(),
            'by_status' => StockCount::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'scheduled_today' => StockCount::whereDate('scheduled_date', today())->count(),
            'completed_today' => StockCount::whereDate('completed_at', today())->count(),
        ];
        return $summary;
    }
}