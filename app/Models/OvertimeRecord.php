<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OvertimeRecord extends Model
{
    use HasFactory;

    protected $table = 'overtime_records';
    protected $primaryKey = 'overtime_id';

    protected $fillable = [
        'employee_id',
        'attendance_id',
        'overtime_date',
        'regular_hours',
        'overtime_hours',
        'reason',
        'status',
        'approved_by',
        'approved_at',
        'approval_notes',
        'overtime_rate',
        'total_overtime_pay',
    ];

    protected $casts = [
        'overtime_date' => 'date',
        'regular_hours' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'overtime_rate' => 'decimal:2',
        'total_overtime_pay' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function attendance()
    {
        return $this->belongsTo(Attendance::class, 'attendance_id', 'attendance_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
