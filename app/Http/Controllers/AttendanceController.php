<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceAudit;
use App\Models\AttendanceCorrection;
use App\Models\Employee;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Attendance::query()->with(['employee', 'shift', 'department']);

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('department_id')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('department_id', $request->input('department_id'));
            });
        }

        if ($request->filled('shift_id')) {
            $query->where('shift_id', $request->shift_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('attendance_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
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
            'shift_id' => 'nullable|integer|exists:shifts,shift_id',
            'break_start' => 'nullable|date',
            'break_end' => 'nullable|date|after:break_start',
            'scheduled_start' => 'nullable',
            'scheduled_end' => 'nullable',
            'notes' => 'nullable|string',
        ]);

        // Calculate time metrics
        $attendance = $this->calculateTimeMetrics($validated);
        
        $attendance = Attendance::create($attendance);
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
            'break_start' => 'nullable|date',
            'break_end' => 'nullable|date|after:break_start',
            'scheduled_start' => 'nullable',
            'scheduled_end' => 'nullable',
            'notes' => 'nullable|string',
        ]);

        // Recalculate time metrics
        $validated = $this->calculateTimeMetrics(array_merge($attendance->toArray(), $validated));
        
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

        // Get employee's shift
        $employee = \App\Models\Employee::find($validated['employee_id']);
        $shift = $employee->primaryShift()->first();

        $attendanceData = [
            'employee_id' => $validated['employee_id'],
            'attendance_date' => today(),
            'clock_in' => now(),
            'status' => 'present',
        ];

        if ($shift) {
            $attendanceData['shift_id'] = $shift->shift_id;
            $attendanceData['scheduled_start'] = $shift->start_time;
            $attendanceData['scheduled_end'] = $shift->end_time;
        }

        // Calculate time metrics
        $attendanceData = $this->calculateTimeMetrics($attendanceData);

        $attendance = Attendance::create($attendanceData);
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

    /**
     * Calculate time metrics for attendance
     */
    private function calculateTimeMetrics($data)
    {
        $clockIn = isset($data['clock_in']) ? \Carbon\Carbon::parse($data['clock_in']) : null;
        $clockOut = isset($data['clock_out']) ? \Carbon\Carbon::parse($data['clock_out']) : null;
        $breakStart = isset($data['break_start']) ? \Carbon\Carbon::parse($data['break_start']) : null;
        $breakEnd = isset($data['break_end']) ? \Carbon\Carbon::parse($data['break_end']) : null;
        $scheduledStart = isset($data['scheduled_start']) ? \Carbon\Carbon::parse($data['scheduled_start']) : null;
        $scheduledEnd = isset($data['scheduled_end']) ? \Carbon\Carbon::parse($data['scheduled_end']) : null;

        // Calculate break hours
        $breakHours = 0;
        if ($breakStart && $breakEnd) {
            $breakHours = $breakStart->diffInMinutes($breakEnd) / 60;
        }
        $data['break_hours'] = round($breakHours, 2);

        // Calculate late minutes
        $lateMinutes = 0;
        if ($clockIn && $scheduledStart) {
            if ($clockIn->gt($scheduledStart)) {
                $lateMinutes = $scheduledStart->diffInMinutes($clockIn);
            }
        }
        $data['late_minutes'] = $lateMinutes;

        // Calculate early departure minutes
        $earlyDepartureMinutes = 0;
        if ($clockOut && $scheduledEnd) {
            if ($clockOut->lt($scheduledEnd)) {
                $earlyDepartureMinutes = $clockOut->diffInMinutes($scheduledEnd);
            }
        }
        $data['early_departure_minutes'] = $earlyDepartureMinutes;

        // Calculate total worked hours
        $totalWorkedHours = 0;
        if ($clockIn && $clockOut) {
            $totalWorkedHours = $clockIn->diffInMinutes($clockOut) / 60;
            // Subtract break hours
            $totalWorkedHours -= $breakHours;
        }
        $data['total_worked_hours'] = max(0, round($totalWorkedHours, 2));

        // Calculate overtime hours (assuming 8 hours standard)
        $overtimeHours = 0;
        if ($totalWorkedHours > 8) {
            $overtimeHours = $totalWorkedHours - 8;
        }
        $data['overtime_hours'] = round($overtimeHours, 2);

        // Update status based on calculations
        if ($lateMinutes > 15) {
            $data['status'] = 'late';
        } elseif ($earlyDepartureMinutes > 30) {
            $data['status'] = 'early_departure';
        }

        return $data;
    }

    public function getStats(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user && $user->hasAnyRole(['Admin', 'Owner', 'HR Manager', 'Supervisor', 'Manager']);
        $branchId = $isAdmin ? $request->input('branch_id') : $user->branch_id;

        $today = now()->toDateString();
        
        $base = Attendance::query()->with('employee');
        if ($branchId) {
            $base->whereHas('employee', function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            });
        }

        $totalEmployees = \App\Models\Employee::query()
            ->when($branchId, function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            })
            ->where('employment_status', 'active')
            ->count();

        $presentToday = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('status', 'present')
            ->count();

        $absentToday = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('status', 'absent')
            ->count();

        $lateToday = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('status', 'late')
            ->count();

        $onLeaveToday = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('status', 'on_leave')
            ->count();

        $earlyDepartures = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('status', 'early_departure')
            ->count();

        $overtimeToday = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('status', 'overtime')
            ->count();

        // New enhanced statistics
        $checkedOutToday = (clone $base)
            ->whereDate('attendance_date', $today)
            ->whereNotNull('clock_out')
            ->count();

        $currentlyWorking = (clone $base)
            ->whereDate('attendance_date', $today)
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->count();

        $totalOvertimeHours = (clone $base)
            ->whereDate('attendance_date', $today)
            ->where('overtime_hours', '>', 0)
            ->sum('overtime_hours');

        $attendanceRate = $totalEmployees > 0 
            ? round(($presentToday / $totalEmployees) * 100, 1) 
            : 0;

        return response()->json([
            'total_employees' => $totalEmployees,
            'present_today' => $presentToday,
            'absent_today' => $absentToday,
            'late_today' => $lateToday,
            'on_leave_today' => $onLeaveToday,
            'early_departures' => $earlyDepartures,
            'overtime_today' => $overtimeToday,
            'checked_out_today' => $checkedOutToday,
            'currently_working' => $currentlyWorking,
            'total_overtime_hours' => $totalOvertimeHours,
            'attendance_rate' => $attendanceRate,
        ]);
    }

    /**
     * Manual attendance correction
     */
    public function manualCorrection(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|integer|exists:employees,employee_id',
            'attendance_date' => 'required|date',
            'clock_in' => 'nullable|date',
            'clock_out' => 'nullable|date|after:clock_in',
            'status' => 'required|in:present,absent,late,half_day,on_leave,holiday,rest_day,early_departure,overtime,off_duty',
            'shift_id' => 'nullable|integer|exists:shifts,shift_id',
            'reason' => 'required|string',
            'notes' => 'nullable|string',
        ]);

        $employee = Employee::find($validated['employee_id']);
        $user = auth()->user();

        // Check if attendance record exists for this date
        $attendance = Attendance::where('employee_id', $validated['employee_id'])
            ->whereDate('attendance_date', $validated['attendance_date'])
            ->first();

        if ($attendance) {
            // Store original values for audit
            $originalValues = [
                'clock_in' => $attendance->clock_in,
                'clock_out' => $attendance->clock_out,
                'status' => $attendance->status,
            ];

            // Update existing record
            $attendance->update([
                'clock_in' => $validated['clock_in'],
                'clock_out' => $validated['clock_out'],
                'status' => $validated['status'],
                'shift_id' => $validated['shift_id'],
                'check_in_method' => 'manual',
                'check_out_method' => 'manual',
            ]);

            // Create correction audit record
            AttendanceCorrection::create([
                'attendance_id' => $attendance->attendance_id,
                'corrected_by' => $user->id,
                'original_clock_in' => $originalValues['clock_in'],
                'original_clock_out' => $originalValues['clock_out'],
                'original_status' => $originalValues['status'],
                'corrected_clock_in' => $validated['clock_in'],
                'corrected_clock_out' => $validated['clock_out'],
                'corrected_status' => $validated['status'],
                'reason' => $validated['reason'],
                'notes' => $validated['notes'],
            ]);

            // Log the correction
            AttendanceAudit::logAction([
                'employee_id' => $validated['employee_id'],
                'attendance_id' => $attendance->attendance_id,
                'action' => 'correction',
                'method' => 'manual',
                'branch_id' => $employee->branch_id,
                'notes' => $validated['reason'],
                'metadata' => [
                    'original_values' => $originalValues,
                    'corrected_values' => $validated,
                    'corrected_by' => $user->id,
                ],
            ]);

            return $attendance->load('employee', 'shift');
        } else {
            // Create new attendance record
            $attendance = Attendance::create([
                'employee_id' => $validated['employee_id'],
                'attendance_date' => $validated['attendance_date'],
                'clock_in' => $validated['clock_in'],
                'clock_out' => $validated['clock_out'],
                'status' => $validated['status'],
                'shift_id' => $validated['shift_id'],
                'check_in_method' => 'manual',
                'check_out_method' => 'manual',
            ]);

            // Log the manual entry
            AttendanceAudit::logAction([
                'employee_id' => $validated['employee_id'],
                'attendance_id' => $attendance->attendance_id,
                'action' => 'manual_entry',
                'method' => 'manual',
                'branch_id' => $employee->branch_id,
                'notes' => $validated['reason'],
                'metadata' => [
                    'created_by' => $user->id,
                ],
            ]);

            return $attendance->load('employee', 'shift');
        }
    }

    /**
     * Get correction history for an attendance record
     */
    public function getCorrections($attendanceId)
    {
        $attendance = Attendance::findOrFail($attendanceId);
        
        return AttendanceCorrection::where('attendance_id', $attendanceId)
            ->with('correctedBy')
            ->latest()
            ->get();
    }
}