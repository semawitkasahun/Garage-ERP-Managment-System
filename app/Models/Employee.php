<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $table = 'employees';
    protected $primaryKey = 'employee_id';

    protected $fillable = [
        'branch_id',
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

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
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

    public function performanceEvaluations()
    {
        return $this->hasMany(PerformanceEvaluation::class, 'employee_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'technician_id');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'technician_id');
    }

    public function jobCardTasks()
    {
        return $this->hasMany(JobCardTask::class, 'technician_id');
    }

    public function laborLogs()
    {
        return $this->hasMany(LaborLog::class, 'technician_id');
    }
}