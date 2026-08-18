<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $table = 'employees';
    protected $primaryKey = 'employee_id';
    public $timestamps = false; // no created_at/updated_at columns on this table

    protected $fillable = [
        'branch_id',
        'department_id',
        'first_name',
        'last_name',
        'job_title',
        'hire_date',
        'phone',
        'email',
        'employment_status',
    ];

    protected $casts = [
        'hire_date' => 'date',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function user()
    {
        return $this->hasOne(User::class, 'employee_id');
    }

    public function technicianSkills()
    {
        return $this->hasMany(TechnicianSkill::class, 'employee_id');
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class, 'employee_id');
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class, 'employee_id');
    }

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class, 'employee_id');
    }

    public function payrollPayments()
    {
        return $this->hasMany(PayrollPayment::class, 'employee_id', 'employee_id');
    }

    public function employeeSalaryStructures()
    {
        return $this->hasMany(EmployeeSalaryStructure::class, 'employee_id');
    }

    public function currentSalaryStructure()
    {
        return $this->hasOne(EmployeeSalaryStructure::class, 'employee_id')
            ->where('is_active', true)
            ->where('effective_date', '<=', now())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->with('salaryStructure');
    }

    public function performanceEvaluations()
    {
        return $this->hasMany(PerformanceEvaluation::class, 'employee_id');
    }

    public function shifts()
    {
        return $this->belongsToMany(Shift::class, 'employee_shifts', 'employee_id', 'shift_id')
            ->withPivot('effective_date', 'end_date', 'is_primary', 'monday_shift_id', 'tuesday_shift_id', 'wednesday_shift_id', 'thursday_shift_id', 'friday_shift_id', 'saturday_shift_id', 'sunday_shift_id')
            ->withTimestamps();
    }

    public function primaryShift()
    {
        return $this->belongsToMany(Shift::class, 'employee_shifts', 'employee_id', 'shift_id')
            ->wherePivot('is_primary', true)
            ->wherePivot('end_date', null)
            ->withPivot('effective_date', 'end_date', 'is_primary', 'monday_shift_id', 'tuesday_shift_id', 'wednesday_shift_id', 'thursday_shift_id', 'friday_shift_id', 'saturday_shift_id', 'sunday_shift_id')
            ->withTimestamps();
    }

    public function weeklySchedule()
    {
        return $this->belongsToMany(Shift::class, 'employee_shifts', 'employee_id', 'shift_id')
            ->wherePivot('is_primary', true)
            ->wherePivot('end_date', null)
            ->withPivot('effective_date', 'end_date', 'is_primary', 'monday_shift_id', 'tuesday_shift_id', 'wednesday_shift_id', 'thursday_shift_id', 'friday_shift_id', 'saturday_shift_id', 'sunday_shift_id')
            ->withTimestamps();
    }
}