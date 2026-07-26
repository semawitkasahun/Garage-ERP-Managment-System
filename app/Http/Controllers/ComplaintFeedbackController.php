<?php

namespace App\Http\Controllers;

use App\Models\ComplaintFeedback;
use Illuminate\Http\Request;

class ComplaintFeedbackController extends Controller
{
    public function index(Request $request)
    {
        $query = ComplaintFeedback::query()->with(['customer']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'related_entity_type' => 'nullable|string|max:30',
            'related_entity_id' => 'nullable|integer',
            'type' => 'required|string|max:20',
            'description' => 'nullable|string',
            'status' => 'nullable|string|max:20',
            'resolution' => 'nullable|string',
        ]);

        $complaint = ComplaintFeedback::create($validated);
        return response()->json($complaint, 201);
    }

    public function show(ComplaintFeedback $complaintFeedback)
    {
        return $complaintFeedback->load('customer');
    }

    public function update(Request $request, ComplaintFeedback $complaintFeedback)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'resolution' => 'nullable|string',
        ]);

        $complaintFeedback->update($validated);
        return $complaintFeedback;
    }

    public function destroy(ComplaintFeedback $complaintFeedback)
    {
        $complaintFeedback->delete();
        return response()->noContent();
    }

    public function resolve(Request $request, ComplaintFeedback $complaintFeedback)
    {
        $validated = $request->validate([
            'resolution' => 'required|string',
        ]);

        $complaintFeedback->update([
            'status' => 'resolved',
            'resolution' => $validated['resolution'],
        ]);

        return $complaintFeedback;
    }
}