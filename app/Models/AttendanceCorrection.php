<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceCorrection extends Model
{
    use HasFactory;

    protected $table = 'attendance_corrections';
    protected $primaryKey = 'correction_id';

    protected $fillable = [
        'attendance_id',
        'corrected_by',
        'original_clock_in',
        'original_clock_out',
        'original_status',
        'corrected_clock_in',
        'corrected_clock_out',
        'corrected_status',
        'reason',
        'notes',
    ];

    protected $casts = [
        'original_clock_in' => 'datetime',
        'original_clock_out' => 'datetime',
        'corrected_clock_in' => 'datetime',
        'corrected_clock_out' => 'datetime',
        'correction_date' => 'datetime',
    ];

    public function attendance()
    {
        return $this->belongsTo(Attendance::class, 'attendance_id', 'attendance_id');
    }

    public function correctedBy()
    {
        return $this->belongsTo(User::class, 'corrected_by');
    }
}
