<?php

namespace App\Http\Controllers;

use App\Models\CheckinChecklistItem;
use Illuminate\Http\Request;

class CheckinChecklistItemController extends Controller
{
    public function index(Request $request)
    {
        $query = CheckinChecklistItem::query()->with(['checkin']);

        if ($request->has('checkin_id')) {
            $query->where('checkin_id', $request->checkin_id);
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
            'checkin_id' => 'required|integer|exists:vehicle_checkins,checkin_id',
            'item_name' => 'nullable|string|max:100',
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:255',
        ]);

        $item = CheckinChecklistItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(CheckinChecklistItem $checkinChecklistItem)
    {
        return $checkinChecklistItem->load('checkin');
    }

    public function update(Request $request, CheckinChecklistItem $checkinChecklistItem)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'notes' => 'nullable|string|max:255',
        ]);

        $checkinChecklistItem->update($validated);
        return $checkinChecklistItem;
    }

    public function destroy(CheckinChecklistItem $checkinChecklistItem)
    {
        $checkinChecklistItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'checkin_id' => 'required|integer|exists:vehicle_checkins,checkin_id',
            'items' => 'required|array',
            'items.*.item_name' => 'required|string|max:100',
            'items.*.status' => 'nullable|string|max:20',
            'items.*.notes' => 'nullable|string|max:255',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['checkin_id'] = $validated['checkin_id'];
            $createdItems[] = CheckinChecklistItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }
}