<?php

namespace App\Http\Controllers;

use App\Models\InspectionFinding;
use Illuminate\Http\Request;

class InspectionFindingController extends Controller
{
    public function index(Request $request)
    {
        $query = InspectionFinding::query()->with(['inspection']);

        if ($request->has('inspection_id')) {
            $query->where('inspection_id', $request->inspection_id);
        }

        if ($request->has('classification')) {
            $query->where('classification', $request->classification);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'inspection_id' => 'required|integer|exists:inspections,inspection_id',
            'description' => 'required|string',
            'classification' => 'required|string|max:20',
            'photo_path' => 'nullable|string|max:255',
        ]);

        $finding = InspectionFinding::create($validated);
        return response()->json($finding, 201);
    }

    public function show(InspectionFinding $inspectionFinding)
    {
        return $inspectionFinding->load([
            'inspection',
            'quotationItems'
        ]);
    }

    public function update(Request $request, InspectionFinding $inspectionFinding)
    {
        $validated = $request->validate([
            'description' => 'sometimes|required|string',
            'classification' => 'sometimes|required|string|max:20',
            'photo_path' => 'nullable|string|max:255',
        ]);

        $inspectionFinding->update($validated);
        return $inspectionFinding;
    }

    public function destroy(InspectionFinding $inspectionFinding)
    {
        $inspectionFinding->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'inspection_id' => 'required|integer|exists:inspections,inspection_id',
            'findings' => 'required|array',
            'findings.*.description' => 'required|string',
            'findings.*.classification' => 'required|string|max:20',
            'findings.*.photo_path' => 'nullable|string|max:255',
        ]);

        $createdFindings = [];
        foreach ($validated['findings'] as $findingData) {
            $findingData['inspection_id'] = $validated['inspection_id'];
            $createdFindings[] = InspectionFinding::create($findingData);
        }

        return response()->json($createdFindings, 201);
    }
}