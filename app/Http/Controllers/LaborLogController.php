<?php

namespace App\Http\Controllers;

use App\Models\LaborLog;
use Illuminate\Http\Request;

class LaborLogController extends Controller
{
    public function index(Request $request)
    {
        $query = LaborLog::query()->with(['task', 'technician']);

        if ($request->has('task_id')) {
            $query->where('task_id', $request->task_id);
        }

        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('clock_in', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('clock_in', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|integer|exists:job_card_tasks,task_id',
            'technician_id' => 'required|integer|exists:users,user_id',
            'clock_in' => 'nullable|date',
            'clock_out' => 'nullable|date|after:clock_in',
            'hours_logged' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
        ]);

        // Calculate hours and cost if not provided
        if (isset($validated['clock_in']) && isset($validated['clock_out']) && !isset($validated['hours_logged'])) {
            $start = \Carbon\Carbon::parse($validated['clock_in']);
            $end = \Carbon\Carbon::parse($validated['clock_out']);
            $validated['hours_logged'] = $start->diffInHours($end);
        }

        if (isset($validated['hours_logged']) && isset($validated['hourly_rate']) && !isset($validated['labor_cost'])) {
            $validated['labor_cost'] = $validated['hours_logged'] * $validated['hourly_rate'];
        }

        $log = LaborLog::create($validated);
        return response()->json($log, 201);
    }

    public function show(LaborLog $laborLog)
    {
        return $laborLog->load(['task', 'technician']);
    }

    public function update(Request $request, LaborLog $laborLog)
    {
        $validated = $request->validate([
            'clock_in' => 'nullable|date',
            'clock_out' => 'nullable|date|after:clock_in',
            'hours_logged' => 'nullable|numeric|min:0',
            'hourly_rate' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
        ]);

        // Recalculate if needed
        if (isset($validated['clock_in']) && isset($validated['clock_out']) && !isset($validated['hours_logged'])) {
            $start = \Carbon\Carbon::parse($validated['clock_in']);
            $end = \Carbon\Carbon::parse($validated['clock_out']);
            $validated['hours_logged'] = $start->diffInHours($end);
        }

        if (isset($validated['hours_logged']) && isset($validated['hourly_rate']) && !isset($validated['labor_cost'])) {
            $validated['labor_cost'] = $validated['hours_logged'] * $validated['hourly_rate'];
        }

        $laborLog->update($validated);
        return $laborLog;
    }

    public function destroy(LaborLog $laborLog)
    {
        $laborLog->delete();
        return response()->noContent();
    }

    public function clockIn(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|integer|exists:job_card_tasks,task_id',
            'technician_id' => 'required|integer|exists:users,user_id',
            'hourly_rate' => 'nullable|numeric|min:0',
        ]);

        // Check if already clocked in
        $existing = LaborLog::where('task_id', $validated['task_id'])
            ->where('technician_id', $validated['technician_id'])
            ->whereNull('clock_out')
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Already clocked in for this task',
                'log' => $existing
            ], 422);
        }

        $log = LaborLog::create([
            'task_id' => $validated['task_id'],
            'technician_id' => $validated['technician_id'],
            'clock_in' => now(),
            'hourly_rate' => $validated['hourly_rate'] ?? 50, // Default rate
        ]);

        return response()->json($log, 201);
    }

    public function clockOut(LaborLog $laborLog)
    {
        if ($laborLog->clock_out) {
            return response()->json([
                'message' => 'Already clocked out',
                'log' => $laborLog
            ], 422);
        }

        $laborLog->update([
            'clock_out' => now(),
        ]);

        // Calculate hours and cost
        $start = \Carbon\Carbon::parse($laborLog->clock_in);
        $end = \Carbon\Carbon::parse($laborLog->clock_out);
        $hours = $start->diffInHours($end);

        $laborLog->update([
            'hours_logged' => $hours,
            'labor_cost' => $hours * $laborLog->hourly_rate,
        ]);

        return $laborLog;
    }

    public function getByTechnician($technicianId)
    {
        $logs = LaborLog::where('technician_id', $technicianId)
            ->with(['task'])
            ->latest()
            ->get();
        return $logs;
    }

    public function getByTask($taskId)
    {
        $logs = LaborLog::where('task_id', $taskId)
            ->with(['technician'])
            ->latest()
            ->get();
        return $logs;
    }

    public function getTotalHours($technicianId)
    {
        $totalHours = LaborLog::where('technician_id', $technicianId)
            ->whereNotNull('hours_logged')
            ->sum('hours_logged');

        $totalCost = LaborLog::where('technician_id', $technicianId)
            ->whereNotNull('labor_cost')
            ->sum('labor_cost');

        return response()->json([
            'technician_id' => $technicianId,
            'total_hours' => $totalHours,
            'total_cost' => $totalCost,
        ]);
    }
}