<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query()->with(['user']);

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->entity_type);
        }// Filter by entity type if provided
        if ($request->has('entity_id')) {
            $query->where('entity_id', $request->entity_id);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        return $query->latest('created_at')
            ->paginate($request->integer('per_page', 20));
    }

    public function show(AuditLog $auditLog)
    {
        return $auditLog->load('user');
    }

    public function destroy(AuditLog $auditLog)
    {
        $auditLog->delete();
        return response()->noContent();
    }

    public function getEntityHistory($entityType, $entityId)
    {
        $logs = AuditLog::where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->with('user')
            ->orderBy('created_at', 'asc')
            ->get();

        return $logs;
    }
}