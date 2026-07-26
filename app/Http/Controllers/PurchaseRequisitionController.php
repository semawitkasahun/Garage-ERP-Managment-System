<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequisition;
use Illuminate\Http\Request;

class PurchaseRequisitionController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseRequisition::query()->with(['branch', 'requestedBy']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('requested_by')) {
            $query->where('requested_by', $request->requested_by);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'requested_by' => 'required|integer|exists:users,user_id',
            'status' => 'nullable|string|max:20',
        ]);

        $requisition = PurchaseRequisition::create($validated);
        return response()->json($requisition, 201);
    }

    public function show(PurchaseRequisition $purchaseRequisition)
    {
        return $purchaseRequisition->load([
            'branch',
            'requestedBy',
            'items' => function ($query) {
                $query->with(['item']);
            },
            'purchaseOrders'
        ]);
    }

    public function update(Request $request, PurchaseRequisition $purchaseRequisition)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
        ]);

        $purchaseRequisition->update($validated);
        return $purchaseRequisition;
    }

    public function destroy(PurchaseRequisition $purchaseRequisition)
    {
        if ($purchaseRequisition->status === 'approved') {
            return response()->json([
                'message' => 'Cannot delete approved requisition'
            ], 422);
        }

        $purchaseRequisition->delete();
        return response()->noContent();
    }

    public function approve(PurchaseRequisition $purchaseRequisition)
    {
        $purchaseRequisition->update(['status' => 'approved']);
        return $purchaseRequisition;
    }

    public function reject(PurchaseRequisition $purchaseRequisition)
    {
        $purchaseRequisition->update(['status' => 'rejected']);
        return $purchaseRequisition;
    }

    public function getByBranch($branchId)
    {
        $requisitions = PurchaseRequisition::where('branch_id', $branchId)
            ->with(['requestedBy', 'items'])
            ->latest()
            ->get();
        return $requisitions;
    }

    public function getPending()
    {
        $requisitions = PurchaseRequisition::where('status', 'pending')
            ->with(['branch', 'requestedBy'])
            ->latest()
            ->get();
        return $requisitions;
    }
}