<?php

namespace App\Http\Controllers;

use App\Models\PartsRequisition;
use Illuminate\Http\Request;

class PartsRequisitionController extends Controller
{
    public function index(Request $request)
    {
        $query = PartsRequisition::query()->with(['jobCard', 'task', 'inventoryItem', 'requestedBy']);

        if ($request->has('job_card_id')) {
            $query->where('job_card_id', $request->job_card_id);
        }

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
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
            'job_card_id' => 'required|integer|exists:job_cards,job_card_id',
            'task_id' => 'nullable|integer|exists:job_card_tasks,task_id',
            'inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
            'quantity_requested' => 'required|numeric|min:0.01',
            'quantity_issued' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
            'requested_by' => 'required|integer|exists:users,user_id',
        ]);

        $requisition = PartsRequisition::create($validated);
        return response()->json($requisition, 201);
    }

    public function show(PartsRequisition $partsRequisition)
    {
        return $partsRequisition->load([
            'jobCard',
            'task',
            'inventoryItem',
            'requestedBy'
        ]);
    }

    public function update(Request $request, PartsRequisition $partsRequisition)
    {
        $validated = $request->validate([
            'quantity_requested' => 'nullable|numeric|min:0.01',
            'quantity_issued' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
        ]);

        $partsRequisition->update($validated);
        return $partsRequisition;
    }

    public function destroy(PartsRequisition $partsRequisition)
    {
        $partsRequisition->delete();
        return response()->noContent();
    }

    public function approve(PartsRequisition $partsRequisition)
    {
        $partsRequisition->update(['status' => 'approved']);
        return $partsRequisition;
    }

    public function issue(PartsRequisition $partsRequisition)
    {
        $partsRequisition->update([
            'status' => 'issued',
            'quantity_issued' => $partsRequisition->quantity_requested,
        ]);

        // Update inventory stock
        if ($partsRequisition->inventory_item_id) {
            // Decrement stock logic
        }

        return $partsRequisition;
    }

    public function reject(PartsRequisition $partsRequisition)
    {
        $partsRequisition->update(['status' => 'rejected']);
        return $partsRequisition;
    }

    public function getByJobCard($jobCardId)
    {
        $requisitions = PartsRequisition::where('job_card_id', $jobCardId)
            ->with(['inventoryItem', 'requestedBy'])
            ->latest()
            ->get();
        return $requisitions;
    }

    public function getByTask($taskId)
    {
        $requisitions = PartsRequisition::where('task_id', $taskId)
            ->with(['inventoryItem', 'requestedBy'])
            ->latest()
            ->get();
        return $requisitions;
    }

    public function getPending()
    {
        $requisitions = PartsRequisition::where('status', 'pending')
            ->with(['jobCard', 'inventoryItem'])
            ->latest()
            ->get();
        return $requisitions;
    }
}