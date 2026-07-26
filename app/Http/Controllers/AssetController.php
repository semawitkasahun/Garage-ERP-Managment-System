<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssetController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Asset::query()->with(['branch']);

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by name
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                ->orWhere('category', 'like', '%' . $search . '%');
            });
        }

        // Filter by purchase date range
        if ($request->has('from_date')) {
            $query->whereDate('purchase_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('purchase_date', '<=', $request->to_date);
        }

        // Filter by value range
        if ($request->has('min_value')) {
            $query->where('current_value', '>=', $request->min_value);
        }

        if ($request->has('max_value')) {
            $query->where('current_value', '<=', $request->max_value);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'name' => 'required|string|max:150',
            'category' => 'nullable|string|max:50',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric|min:0',
            'depreciation_method' => [
                'nullable',
                'string',
                'max:30',
                Rule::in(['straight_line', 'declining_balance', 'units_of_production'])
            ],
            'useful_life_years' => 'nullable|integer|min:1|max:50',
            'current_value' => 'nullable|numeric|min:0',
            'status' => [
                'nullable',
                'string',
                'max:20',
                Rule::in(['active', 'inactive', 'maintenance', 'disposed'])
            ],
        ]);

        // Calculate depreciation if not provided
        if (!isset($validated['current_value']) && isset($validated['purchase_cost'])) {
            $validated['current_value'] = $validated['purchase_cost'];
        }

        $asset = Asset::create($validated);
        return response()->json($asset, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Asset $asset)
    {
        return $asset->load([
            'branch',
            'maintenanceSchedules',
            'bookings' => function ($query) {
                $query->with(['bookedBy', 'jobCard']);
            },
            'depreciationRecords'
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'name' => 'sometimes|required|string|max:150',
            'category' => 'nullable|string|max:50',
            'purchase_date' => 'nullable|date',
            'purchase_cost' => 'nullable|numeric|min:0',
            'depreciation_method' => [
                'nullable',
                'string',
                'max:30',
                Rule::in(['straight_line', 'declining_balance', 'units_of_production'])
            ],
            'useful_life_years' => 'nullable|integer|min:1|max:50',
            'current_value' => 'nullable|numeric|min:0',
            'status' => [
                'nullable',
                'string',
                'max:20',
                Rule::in(['active', 'inactive', 'maintenance', 'disposed'])
            ],
        ]);

        $asset->update($validated);
        return $asset;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Asset $asset)
    {
        // Check if asset has active bookings
        if ($asset->bookings()->where('status', 'active')->exists()) {
            return response()->json([
                'message' => 'Cannot delete asset with active bookings'
            ], 422);
        }

        $asset->delete();
        return response()->noContent();
    }

    /**
     * Get assets by category.
     */
    public function getByCategory($category)
    {
        $assets = Asset::where('category', $category)
            ->with(['branch'])
            ->latest()
            ->get();
        return $assets;
    }

    /**
     * Get assets by status.
     */
    public function getByStatus($status)
    {
        $assets = Asset::where('status', $status)
            ->with(['branch'])
            ->latest()
            ->get();
        return $assets;
    }

    /**
     * Get assets by branch.
     */
    public function getByBranch($branchId)
    {
        $assets = Asset::where('branch_id', $branchId)
            ->with(['branch'])
            ->latest()
            ->get();
        return $assets;
    }

    /**
     * Calculate depreciation for an asset.
     */
    public function calculateDepreciation(Asset $asset)
    {
        if (!$asset->purchase_cost || !$asset->useful_life_years) {
            return response()->json([
                'message' => 'Asset must have purchase cost and useful life years',
                'can_calculate' => false
            ]);
        }

        $currentYear = date('Y');
        $purchaseYear = date('Y', strtotime($asset->purchase_date));
        $yearsUsed = $currentYear - $purchaseYear;

        $depreciationData = [
            'asset_id' => $asset->asset_id,
            'name' => $asset->name,
            'purchase_cost' => $asset->purchase_cost,
            'current_value' => $asset->current_value,
            'useful_life_years' => $asset->useful_life_years,
            'years_used' => $yearsUsed,
        ];

        switch ($asset->depreciation_method) {
            case 'straight_line':
                $annualDepreciation = $asset->purchase_cost / $asset->useful_life_years;
                $depreciationData['annual_depreciation'] = round($annualDepreciation, 2);
                $depreciationData['method'] = 'straight_line';
                break;

            case 'declining_balance':
                $rate = 2 / $asset->useful_life_years; // Double declining
                $depreciationData['rate'] = round($rate * 100, 2) . '%';
                $depreciationData['method'] = 'declining_balance';
                break;

            default:
                $depreciationData['method'] = 'not_specified';
        }

        return $depreciationData;
    }

    /**
     * Record depreciation for an asset.
     */
    public function recordDepreciation(Request $request, Asset $asset)
    {
        $validated = $request->validate([
            'period' => 'required|string|max:20',
            'depreciation_amount' => 'required|numeric|min:0',
            'book_value' => 'required|numeric|min:0',
        ]);

        $record = $asset->depreciationRecords()->create($validated);

        // Update asset current value
        $asset->update([
            'current_value' => $validated['book_value']
        ]);

        return response()->json([
            'message' => 'Depreciation recorded successfully',
            'record' => $record,
            'asset' => $asset
        ], 201);
    }

    /**
     * Get depreciation history for an asset.
     */
    public function getDepreciationHistory(Asset $asset)
    {
        $history = $asset->depreciationRecords()
            ->orderBy('period', 'desc')
            ->get();
        return $history;
    }

    /**
     * Get asset maintenance schedule.
     */
    public function getMaintenanceSchedule(Asset $asset)
    {
        $schedule = $asset->maintenanceSchedules()
            ->orderBy('next_due', 'asc')
            ->get();
        return $schedule;
    }

    /**
     * Get asset availability.
     */
    public function getAvailability(Asset $asset)
    {
        $activeBookings = $asset->bookings()
            ->where('status', 'active')
            ->where('end_time', '>', now())
            ->count();

        $isAvailable = $activeBookings == 0 && $asset->status === 'active';

        return response()->json([
            'asset_id' => $asset->asset_id,
            'name' => $asset->name,
            'status' => $asset->status,
            'is_available' => $isAvailable,
            'active_bookings_count' => $activeBookings,
        ]);
    }

    /**
     * Bulk update asset status.
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'asset_ids' => 'required|array',
            'asset_ids.*' => 'integer|exists:assets,asset_id',
            'status' => 'required|string|in:active,inactive,maintenance,disposed',
        ]);

        $updated = Asset::whereIn('asset_id', $validated['asset_ids'])
            ->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "{$updated} assets updated successfully",
            'status' => $validated['status']
        ]);
    }

    /**
     * Get asset statistics.
     */
    public function getStatistics(Request $request)
    {
        $branchId = $request->branch_id;

        $query = Asset::query();
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $stats = [
            'total_assets' => $query->count(),
            'by_status' => $query->select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'by_category' => $query->select('category', \DB::raw('count(*) as count'))
                ->whereNotNull('category')
                ->groupBy('category')
                ->get(),
            'total_value' => $query->sum('current_value'),
            'average_value' => $query->avg('current_value'),
        ];

        return $stats;
    }
}