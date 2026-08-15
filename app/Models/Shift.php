<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory;

    protected $table = 'shifts';
    protected $primaryKey = 'shift_id';

    protected $fillable = [
        'name',
        'branch_id',
        'department_id',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
        'break_duration_minutes',
        'expected_hours',
        'overtime_threshold',
        'overtime_rate',
        'grace_period_minutes',
        'pattern',
        'working_days',
        'is_active',
    ];

    protected $casts = [
        'working_days' => 'array',
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class, 'shift_id', 'shift_id');
    }

    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_shifts', 'shift_id', 'employee_id');
    }
}
