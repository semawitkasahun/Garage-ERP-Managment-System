<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::query()->with(['employee']);

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('attendance_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'attendance_date' => 'required|date',
            'clock_in' => 'nullable|date',
            'clock_out' => 'nullable|date|after:clock_in',
            'status' => 'nullable|string|max:20',
        ]);

        $attendance = Attendance::create($validated);
        return response()->json($attendance, 201);
    }

    public function show(Attendance $attendance)
    {
        return $attendance->load('employee');
    }

    public function update(Request $request, Attendance $attendance)
    {
        $validated = $request->validate([
            'clock_in' => 'nullable|date',
            'clock_out' => 'nullable|date|after:clock_in',
            'status' => 'nullable|string|max:20',
        ]);

        $attendance->update($validated);
        return $attendance;
    }

    public function destroy(Attendance $attendance)
    {
        $attendance->delete();
        return response()->noContent();
    }

    public function clockIn(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
        ]);

        // Check if already clocked in today
        $existing = Attendance::where('employee_id', $validated['employee_id'])
            ->whereDate('attendance_date', today())
            ->first();

        if ($existing && $existing->clock_in) {
            return response()->json([
                'message' => 'Already clocked in today'
            ], 422);
        }

        $attendance = Attendance::create([
            'employee_id' => $validated['employee_id'],
            'attendance_date' => today(),
            'clock_in' => now(),
            'status' => 'present',
        ]);

        return response()->json($attendance, 201);
    }

    public function clockOut(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
        ]);

        $attendance = Attendance::where('employee_id', $validated['employee_id'])
            ->whereDate('attendance_date', today())
            ->first();

        if (!$attendance) {
            return response()->json([
                'message' => 'No clock-in record found for today'
            ], 404);
        }

        if ($attendance->clock_out) {
            return response()->json([
                'message' => 'Already clocked out today'
            ], 422);
        }

        $attendance->update(['clock_out' => now()]);
        return $attendance;
    }

    public function getByEmployee($employeeId)
    {
        $attendance = Attendance::where('employee_id', $employeeId)
            ->latest()
            ->get();
        return $attendance;
    }

    public function getToday()
    {
        $attendance = Attendance::whereDate('attendance_date', today())
            ->with(['employee'])
            ->get();
        return $attendance;
    }

    public function getSummary(Request $request)
    {
        $validated = $request->validate([
            'from_date' => 'required|date',
            'to_date' => 'required|date|after:from_date',
            'employee_id' => 'nullable|integer|exists:employees,employee_id',
        ]);

        $query = Attendance::whereBetween('attendance_date', [
            $validated['from_date'],
            $validated['to_date']
        ]);

        if (isset($validated['employee_id'])) {
            $query->where('employee_id', $validated['employee_id']);
        }

        $summary = [
            'total_days' => $query->count(),
            'by_status' => (clone $query)->select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'present' => (clone $query)->where('status', 'present')->count(),
            'absent' => (clone $query)->where('status', 'absent')->count(),
            'late' => (clone $query)->where('status', 'late')->count(),
        ];

        return $summary;
    }
}