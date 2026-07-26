<?php

namespace App\Http\Controllers;

use App\Models\CommunicationLog;
use Illuminate\Http\Request;

class CommunicationLogController extends Controller
{
    public function index(Request $request)
    {
        $query = CommunicationLog::query()->with(['customer', 'createdBy']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('channel')) {
            $query->where('channel', $request->channel);
        }

        if ($request->has('direction')) {
            $query->where('direction', $request->direction);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'channel' => 'nullable|string|max:20',
            'direction' => 'nullable|string|max:10',
            'subject' => 'nullable|string|max:150',
            'content' => 'nullable|string',
            'created_by' => 'required|integer|exists:users,user_id',
        ]);

        $log = CommunicationLog::create($validated);
        return response()->json($log, 201);
    }

    public function show(CommunicationLog $communicationLog)
    {
        return $communicationLog->load(['customer', 'createdBy']);
    }

    public function update(Request $request, CommunicationLog $communicationLog)
    {
        $validated = $request->validate([
            'subject' => 'nullable|string|max:150',
            'content' => 'nullable|string',
        ]);

        $communicationLog->update($validated);
        return $communicationLog;
    }

    public function destroy(CommunicationLog $communicationLog)
    {
        $communicationLog->delete();
        return response()->noContent();
    }
}