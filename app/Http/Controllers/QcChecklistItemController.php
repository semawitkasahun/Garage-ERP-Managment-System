<?php

namespace App\Http\Controllers;

use App\Models\QcChecklistItem;
use Illuminate\Http\Request;

class QcChecklistItemController extends Controller
{
    public function index(Request $request)
    {
        $query = QcChecklistItem::query()->with(['qualityControlCheck']);

        if ($request->has('qc_id')) {
            $query->where('qc_id', $request->qc_id);
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
            'qc_id' => 'required|integer|exists:quality_control_checks,qc_id',
            'item_name' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:255',
        ]);

        $item = QcChecklistItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(QcChecklistItem $qcChecklistItem)
    {
        return $qcChecklistItem->load('qualityControlCheck');
    }

    public function update(Request $request, QcChecklistItem $qcChecklistItem)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:255',
        ]);

        $qcChecklistItem->update($validated);
        return $qcChecklistItem;
    }

    public function destroy(QcChecklistItem $qcChecklistItem)
    {
        $qcChecklistItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'qc_id' => 'required|integer|exists:quality_control_checks,qc_id',
            'items' => 'required|array',
            'items.*.item_name' => 'required|string|max:100',
            'items.*.status' => 'nullable|string|max:20',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['qc_id'] = $validated['qc_id'];
            $createdItems[] = QcChecklistItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getByQcCheck($qcId)
    {
        $items = QcChecklistItem::where('qc_id', $qcId)->get();
        return $items;
    }
}