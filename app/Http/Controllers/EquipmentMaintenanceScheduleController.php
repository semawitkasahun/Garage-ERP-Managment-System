<?php

namespace App\Http\Controllers;

use App\Models\EquipmentMaintenanceSchedule;
use Illuminate\Http\Request;

class EquipmentMaintenanceScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = EquipmentMaintenanceSchedule::query()->with(['asset']);

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        if ($request->has('maintenance_type')) {
            $query->where('maintenance_type', $request->maintenance_type);
        }

        if ($request->has('next_due_before')) {
            $query->where('next_due', '<=', $request->next_due_before);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|integer|exists:assets,asset_id',
            'maintenance_type' => 'nullable|string|max:50',
            'frequency_days' => 'nullable|integer|min:1',
            'last_performed' => 'nullable|date',
            'next_due' => 'nullable|date|after:last_performed',
        ]);

        $schedule = EquipmentMaintenanceSchedule::create($validated);
        return response()->json($schedule, 201);
    }

    public function show(EquipmentMaintenanceSchedule $equipmentMaintenanceSchedule)
    {
        return $equipmentMaintenanceSchedule->load('asset');
    }

    public function update(Request $request, EquipmentMaintenanceSchedule $equipmentMaintenanceSchedule)
    {
        $validated = $request->validate([
            'frequency_days' => 'nullable|integer|min:1',
            'last_performed' => 'nullable|date',
            'next_due' => 'nullable|date|after:last_performed',
        ]);

        $equipmentMaintenanceSchedule->update($validated);
        return $equipmentMaintenanceSchedule;
    }

    public function destroy(EquipmentMaintenanceSchedule $equipmentMaintenanceSchedule)
    {
        $equipmentMaintenanceSchedule->delete();
        return response()->noContent();
    }

    public function perform(Request $request, EquipmentMaintenanceSchedule $equipmentMaintenanceSchedule)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        $lastPerformed = now();
        $nextDue = $lastPerformed->copy()->addDays($equipmentMaintenanceSchedule->frequency_days);

        $equipmentMaintenanceSchedule->update([
            'last_performed' => $lastPerformed,
            'next_due' => $nextDue,
        ]);

        return $equipmentMaintenanceSchedule;
    }

    public function getByAsset($assetId)
    {
        $schedules = EquipmentMaintenanceSchedule::where('asset_id', $assetId)
            ->latest()
            ->get();
        return $schedules;
    }

    public function getUpcoming($days = 30)
    {
        $schedules = EquipmentMaintenanceSchedule::where('next_due', '<=', now()->addDays($days))
            ->where('next_due', '>=', now())
            ->with(['asset'])
            ->orderBy('next_due', 'asc')
            ->get();
        return $schedules;
    }

    public function getOverdue()
    {
        $schedules = EquipmentMaintenanceSchedule::where('next_due', '<', now())
            ->with(['asset'])
            ->orderBy('next_due', 'asc')
            ->get();
        return $schedules;
    }
}