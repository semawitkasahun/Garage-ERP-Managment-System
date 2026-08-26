<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceAudit;
use App\Models\Employee;
use App\Models\QrAttendanceToken;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QrAttendanceController extends Controller
{
    /**
     * Generate a new QR token for a branch
     */
    public function generateToken(Request $request)
    {
        // Get branch_id from request or authenticated user
        $branchId = $request->input('branch_id');
        if (!$branchId && auth()->check()) {
            $branchId = auth()->user()->branch_id;
        }

        // If still no branch_id, use default branch 1
        if (!$branchId) {
            $branchId = 1;
        }

        // Clean up old expired tokens
        QrAttendanceToken::cleanupExpired();

        // Generate new token
        $token = QrAttendanceToken::createForBranch(
            $branchId,
            $request->ip(),
            $request->userAgent()
        );

        // Log token generation
        AttendanceAudit::logAction([
            'action' => 'token_generated',
            'branch_id' => $branchId,
            'qr_token_id' => $token->token_id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'token' => $token->token,
            'token_id' => $token->token_id,
            'expires_at' => $token->expires_at,
            'branch_id' => $token->branch_id,
        ]);
    }

    /**
     * Validate a QR token
     */
    public function validateToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $qrToken = QrAttendanceToken::where('token', $request->token)->first();

        if (!$qrToken) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid QR code',
            ], 404);
        }

        if ($qrToken->isExpired()) {
            return response()->json([
                'valid' => false,
                'message' => 'QR code expired. Please scan the current QR code displayed at the garage.',
            ], 400);
        }

        if ($qrToken->is_used) {
            return response()->json([
                'valid' => false,
                'message' => 'This QR code has already been used. Please scan the current QR code.',
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'token_id' => $qrToken->token_id,
            'branch_id' => $qrToken->branch_id,
            'expires_at' => $qrToken->expires_at,
        ]);
    }

    /**
     * Process check-in via QR
     */
    public function checkIn(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $user = Auth::user();
        if (!$user || !$user->employee) {
            return response()->json([
                'success' => false,
                'message' => 'Please log in to continue.',
            ], 401);
        }

        $employee = $user->employee;
        
        // Validate employee is active
        if ($employee->employment_status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is not active. Please contact HR.',
            ], 403);
        }

        // Validate QR token
        $qrToken = QrAttendanceToken::where('token', $request->token)->first();
        
        if (!$qrToken || !$qrToken->isValid()) {
            $message = $qrToken && $qrToken->isExpired() 
                ? 'QR code expired. Please scan the current QR code.'
                : ($qrToken && $qrToken->is_used 
                    ? 'This QR code has already been used.'
                    : 'Invalid QR code.');
            
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 400);
        }

        // Check branch restrictions
        if ($employee->branch_id && $employee->branch_id != $qrToken->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'You are not authorized to record attendance at this branch.',
            ], 403);
        }

        // Check if already checked in today
        $today = Carbon::today();
        $existingAttendance = Attendance::where('employee_id', $employee->employee_id)
            ->whereDate('attendance_date', $today)
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->first();

        if ($existingAttendance) {
            return response()->json([
                'success' => false,
                'message' => 'You have already checked in today.',
                'attendance' => $existingAttendance,
            ], 400);
        }

        // Get employee's shift for today
        $shift = $this->getEmployeeShiftForToday($employee);
        $scheduledStart = $shift ? $shift->start_time : '08:00';
        $scheduledEnd = $shift ? $shift->end_time : '17:00';

        // Create attendance record
        $attendance = Attendance::create([
            'employee_id' => $employee->employee_id,
            'attendance_date' => $today,
            'clock_in' => now(),
            'status' => 'present',
            'shift_id' => $shift ? $shift->shift_id : null,
            'scheduled_start' => $today . ' ' . $scheduledStart,
            'scheduled_end' => $today . ' ' . $scheduledEnd,
            'check_in_method' => 'qr',
        ]);

        // Calculate late minutes
        $attendance->calculateLateMinutes();
        $attendance->save();

        // Mark token as used
        $qrToken->markAsUsed($employee->employee_id);

        // Log check-in
        AttendanceAudit::logAction([
            'employee_id' => $employee->employee_id,
            'attendance_id' => $attendance->attendance_id,
            'action' => 'check_in',
            'method' => 'qr',
            'branch_id' => $qrToken->branch_id,
            'qr_token_id' => $qrToken->token_id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-in successful',
            'attendance' => $attendance->load('employee', 'shift'),
        ]);
    }

    /**
     * Process check-out via QR
     */
    public function checkOut(Request $request)
    {
        $request->validate([
            'token' => 'required|string|size:64',
        ]);

        $user = Auth::user();
        if (!$user || !$user->employee) {
            return response()->json([
                'success' => false,
                'message' => 'Please log in to continue.',
            ], 401);
        }

        $employee = $user->employee;
        
        // Validate QR token
        $qrToken = QrAttendanceToken::where('token', $request->token)->first();
        
        if (!$qrToken || !$qrToken->isValid()) {
            $message = $qrToken && $qrToken->isExpired() 
                ? 'QR code expired. Please scan the current QR code.'
                : ($qrToken && $qrToken->is_used 
                    ? 'This QR code has already been used.'
                    : 'Invalid QR code.');
            
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 400);
        }

        // Find today's attendance record
        $today = Carbon::today();
        $attendance = Attendance::where('employee_id', $employee->employee_id)
            ->whereDate('attendance_date', $today)
            ->whereNotNull('clock_in')
            ->whereNull('clock_out')
            ->first();

        if (!$attendance) {
            return response()->json([
                'success' => false,
                'message' => 'No active check-in found. Please check in first.',
            ], 400);
        }

        // Update attendance with check-out
        $attendance->clock_out = now();
        $attendance->check_out_method = 'qr';
        $attendance->calculateWorkedHours();
        $attendance->calculateOvertime();
        $attendance->calculateEarlyDeparture();
        $attendance->save();

        // Mark token as used
        $qrToken->markAsUsed($employee->employee_id);

        // Log check-out
        AttendanceAudit::logAction([
            'employee_id' => $employee->employee_id,
            'attendance_id' => $attendance->attendance_id,
            'action' => 'check_out',
            'method' => 'qr',
            'branch_id' => $qrToken->branch_id,
            'qr_token_id' => $qrToken->token_id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Check-out successful',
            'attendance' => $attendance->load('employee', 'shift'),
        ]);
    }

    /**
     * Get employee's shift for today
     */
    private function getEmployeeShiftForToday($employee)
    {
        $dayOfWeek = Carbon::now()->dayOfWeekIso; // 1-7 (Monday-Sunday)
        
        $weeklySchedule = $employee->weeklySchedule()->first();
        
        if (!$weeklySchedule) {
            return null;
        }

        $dayColumn = ['monday_shift_id', 'tuesday_shift_id', 'wednesday_shift_id', 
                     'thursday_shift_id', 'friday_shift_id', 'saturday_shift_id', 'sunday_shift_id'][$dayOfWeek - 1];
        
        $shiftId = $weeklySchedule->pivot->$dayColumn;
        
        if (!$shiftId) {
            return null;
        }

        return Shift::find($shiftId);
    }

    /**
     * Get current attendance status for authenticated employee
     */
    public function getCurrentStatus(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->employee) {
            return response()->json([
                'checked_in' => false,
                'message' => 'Not authenticated',
            ], 401);
        }

        $employee = $user->employee;
        $today = Carbon::today();

        $attendance = Attendance::where('employee_id', $employee->employee_id)
            ->whereDate('attendance_date', $today)
            ->first();

        if (!$attendance) {
            return response()->json([
                'checked_in' => false,
                'checked_out' => false,
                'message' => 'Ready to Check In',
                'shift' => $this->getEmployeeShiftForToday($employee),
            ]);
        }

        if (!$attendance->clock_out) {
            return response()->json([
                'checked_in' => true,
                'checked_out' => false,
                'message' => 'Ready to Check Out',
                'attendance' => $attendance->load('shift'),
            ]);
        }

        return response()->json([
            'checked_in' => true,
            'checked_out' => true,
            'message' => 'Already checked out',
            'attendance' => $attendance->load('shift'),
        ]);
    }
}
