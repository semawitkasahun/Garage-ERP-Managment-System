<?php

namespace App\Http\Controllers;

use App\Models\NotificationTemplate;
use Illuminate\Http\Request;

class NotificationTemplateController extends Controller
{
    public function index(Request $request)
    {
        return NotificationTemplate::query()
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }// Filter by entity type if provided
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'channel' => 'required|string|max:20',
            'trigger_event' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:150',
            'body' => 'nullable|string',
        ]);

        $template = NotificationTemplate::create($validated);
        return response()->json($template, 201);
    }

    public function show(NotificationTemplate $notificationTemplate)
    {
        return $notificationTemplate->load('notificationLogs');
    }

    public function update(Request $request, NotificationTemplate $notificationTemplate)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'channel' => 'sometimes|required|string|max:20',
            'trigger_event' => 'nullable|string|max:50',
            'subject' => 'nullable|string|max:150',
            'body' => 'nullable|string',
        ]);

        $notificationTemplate->update($validated);
        return $notificationTemplate;
    }

    public function destroy(NotificationTemplate $notificationTemplate)
    {
        $notificationTemplate->delete();
        return response()->noContent();
    }

    public function getByTrigger($triggerEvent)
    {
        $templates = NotificationTemplate::where('trigger_event', $triggerEvent)->get();
        return $templates;
    }
}