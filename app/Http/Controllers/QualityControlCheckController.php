<?php

namespace App\Http\Controllers;

use App\Models\QualityControlCheck;
use Illuminate\Http\Request;

class QualityControlCheckController extends Controller
{
    public function index(Request $request)
    {
        $query = QualityControlCheck::query()->with(['jobCard', 'inspector']);

        if ($request->has('job_card_id')) {
            $query->where('job_card_id', $request->job_card_id);
        }

        if ($request->has('inspector_id')) {
            $query->where('inspector_id', $request->inspector_id);
        }

        if ($request->has('result')) {
            $query->where('result', $request->result);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'job_card_id' => 'required|integer|exists:job_cards,job_card_id',
            'inspector_id' => 'required|integer|exists:users,user_id',
            'result' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
        ]);

        $check = QualityControlCheck::create($validated);
        return response()->json($check, 201);
    }

    public function show(QualityControlCheck $qualityControlCheck)
    {
        return $qualityControlCheck->load([
            'jobCard',
            'inspector',
            'checklistItems'
        ]);
    }

    public function update(Request $request, QualityControlCheck $qualityControlCheck)
    {
        $validated = $request->validate([
            'result' => 'nullable|string|max:10',
            'notes' => 'nullable|string',
        ]);

        $qualityControlCheck->update($validated);
        return $qualityControlCheck;
    }

    public function destroy(QualityControlCheck $qualityControlCheck)
    {
        $qualityControlCheck->delete();
        return response()->noContent();
    }

    public function pass(QualityControlCheck $qualityControlCheck)
    {
        $qualityControlCheck->update([
            'result' => 'pass',
            'checked_at' => now(),
        ]);
        return $qualityControlCheck;
    }

    public function fail(Request $request, QualityControlCheck $qualityControlCheck)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $qualityControlCheck->update([
            'result' => 'fail',
            'checked_at' => now(),
            'notes' => $validated['notes'] ?? $qualityControlCheck->notes,
        ]);
        return $qualityControlCheck;
    }

    public function getByJobCard($jobCardId)
    {
        $checks = QualityControlCheck::where('job_card_id', $jobCardId)
            ->with(['inspector', 'checklistItems'])
            ->latest()
            ->get();
        return $checks;
    }

    public function getFailed()
    {
        $checks = QualityControlCheck::where('result', 'fail')
            ->with(['jobCard', 'inspector'])
            ->latest()
            ->get();
        return $checks;
    }

    public function getPassed()
    {
        $checks = QualityControlCheck::where('result', 'pass')
            ->with(['jobCard', 'inspector'])
            ->latest()
            ->get();
        return $checks;
    }
}