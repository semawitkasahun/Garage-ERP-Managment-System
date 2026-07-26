<?php

namespace App\Http\Controllers;

use App\Models\NotificationLog;
use Illuminate\Http\Request;

class NotificationLogController extends Controller
{
    public function index(Request $request)
    {
        $query = NotificationLog::query()->with(['template']);

        if ($request->has('recipient_type')) {
            $query->where('recipient_type', $request->recipient_type);
        }

        if ($request->has('recipient_id')) {
            $query->where('recipient_id', $request->recipient_id);
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
            'template_id' => 'required|integer|exists:notification_templates,template_id',
            'recipient_type' => 'nullable|string|max:20',
            'recipient_id' => 'nullable|integer',
            'channel' => 'nullable|string|max:20',
            'status' => 'nullable|string|max:20',
            'sent_at' => 'nullable|date',
        ]);

        $log = NotificationLog::create($validated);
        return response()->json($log, 201);
    }

    public function show(NotificationLog $notificationLog)
    {
        return $notificationLog->load('template');
    }

    public function update(Request $request, NotificationLog $notificationLog)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'sent_at' => 'nullable|date',
        ]);

        $notificationLog->update($validated);
        return $notificationLog;
    }

    public function destroy(NotificationLog $notificationLog)
    {
        $notificationLog->delete();
        return response()->noContent();
    }
}