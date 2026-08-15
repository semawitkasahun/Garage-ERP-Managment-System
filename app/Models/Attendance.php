<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $table = 'attendance';
    protected $primaryKey = 'attendance_id';

    protected $fillable = [
        'employee_id',
        'attendance_date',
        'clock_in',
        'clock_out',
        'status',
        'shift_id',
        'break_start',
        'break_end',
        'scheduled_start',
        'scheduled_end',
        'late_minutes',
        'early_departure_minutes',
        'total_worked_hours',
        'overtime_hours',
        'break_hours',
        'notes',
        'check_in_method',
        'check_out_method',
    ];

    protected $casts = [
        'attendance_date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class, 'shift_id', 'shift_id');
    }

    public function corrections()
    {
        return $this->hasMany(AttendanceCorrection::class, 'attendance_id', 'attendance_id');
    }

    public function overtimeRecords()
    {
        return $this->hasMany(OvertimeRecord::class, 'attendance_id', 'attendance_id');
    }
}