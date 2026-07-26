<?php

namespace App\Http\Controllers;

use App\Models\AssetDepreciationRecord;
use Illuminate\Http\Request;
use App\Models\Asset;

class AssetDepreciationRecordController extends Controller
{
    public function index(Request $request)
    {
        $query = AssetDepreciationRecord::query()->with(['asset']);

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        if ($request->has('period')) {
            $query->where('period', $request->period);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|integer|exists:assets,asset_id',
            'period' => 'nullable|string|max:20',
            'depreciation_amount' => 'nullable|numeric|min:0',
            'book_value' => 'nullable|numeric|min:0',
        ]);

        $record = AssetDepreciationRecord::create($validated);

        // Update asset current value
        if (isset($validated['book_value'])) {
            $record->asset->update(['current_value' => $validated['book_value']]);
        }

        return response()->json($record, 201);
    }

    public function show(AssetDepreciationRecord $assetDepreciationRecord)
    {
        return $assetDepreciationRecord->load('asset');
    }

    public function update(Request $request, AssetDepreciationRecord $assetDepreciationRecord)
    {
        $validated = $request->validate([
            'depreciation_amount' => 'nullable|numeric|min:0',
            'book_value' => 'nullable|numeric|min:0',
        ]);

        $assetDepreciationRecord->update($validated);

        // Update asset current value
        if (isset($validated['book_value'])) {
            $assetDepreciationRecord->asset->update(['current_value' => $validated['book_value']]);
        }

        return $assetDepreciationRecord;
    }

    public function destroy(AssetDepreciationRecord $assetDepreciationRecord)
    {
        $assetDepreciationRecord->delete();
        return response()->noContent();
    }

    public function getByAsset($assetId)
    {
        $records = AssetDepreciationRecord::where('asset_id', $assetId)
            ->orderBy('period', 'desc')
            ->get();
        return $records;
    }

    public function getLatest($assetId)
    {
        $record = AssetDepreciationRecord::where('asset_id', $assetId)
            ->latest()
            ->first();

        return $record ?? response()->json(['message' => 'No depreciation records found'], 404);
    }

    public function calculateStraightLine(Request $request, $assetId)
    {
        $asset = Asset::findOrFail($assetId);

        $validated = $request->validate([
            'period' => 'required|string|max:20',
        ]);

        if (!$asset->purchase_cost || !$asset->useful_life_years) {
            return response()->json([
                'message' => 'Asset must have purchase cost and useful life years'
            ], 422);
        }

        $annualDepreciation = $asset->purchase_cost / $asset->useful_life_years;
        $newBookValue = $asset->current_value - $annualDepreciation;

        if ($newBookValue < 0) {
            $newBookValue = 0;
        }

        $record = AssetDepreciationRecord::create([
            'asset_id' => $asset->asset_id,
            'period' => $validated['period'],
            'depreciation_amount' => $annualDepreciation,
            'book_value' => $newBookValue,
        ]);

        $asset->update(['current_value' => $newBookValue]);

        return $record;
    }

    public function getSummary($assetId)
    {
        $records = AssetDepreciationRecord::where('asset_id', $assetId);

        $summary = [
            'total_depreciation' => $records->sum('depreciation_amount'),
            'current_book_value' => $records->latest()->first()?->book_value ?? 0,
            'total_records' => $records->count(),
            'by_period' => (clone $records)->select('period', 
                    \DB::raw('sum(depreciation_amount) as total_depreciation'),
                    \DB::raw('max(book_value) as book_value')
                )
                ->groupBy('period')
                ->orderBy('period', 'desc')
                ->get(),
        ];

        return $summary;
    }
}