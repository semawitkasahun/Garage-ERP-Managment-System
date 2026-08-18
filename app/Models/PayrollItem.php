<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollItem extends Model
{
    use HasFactory;

    protected $table = 'payroll_items';
    protected $primaryKey = 'payroll_item_id';

    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'base_pay',
        'overtime_pay',
        'deductions',
        'net_pay',
        'working_days',
        'days_present',
        'paid_leave_days',
        'unpaid_leave_days',
        'overtime_hours',
        'basic_salary',
        'total_allowances',
        'gross_salary',
        'status',
        'payroll_period_id',
        'salary_structure_id',
        'reviewed_at',
        'reviewed_by',
        'approved_at',
        'approved_by',
        'paid_at',
        'absent_days',
        'late_days',
        'leave_days',
        'attendance_deduction',
        'tax_amount',
        'pension_amount',
        'bonuses',
    ];

    protected $casts = [
        'base_pay' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'working_days' => 'integer',
        'days_present' => 'integer',
        'paid_leave_days' => 'integer',
        'unpaid_leave_days' => 'integer',
        'overtime_hours' => 'decimal:2',
        'basic_salary' => 'decimal:2',
        'total_allowances' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'reviewed_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
        'absent_days' => 'integer',
        'late_days' => 'integer',
        'leave_days' => 'integer',
        'attendance_deduction' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'pension_amount' => 'decimal:2',
        'bonuses' => 'decimal:2',
    ];

    // Relationships
    public function payrollRun()
    {
        return $this->belongsTo(PayrollRun::class, 'payroll_run_id', 'payroll_run_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id');
    }

    public function salaryStructure()
    {
        return $this->belongsTo(SalaryStructure::class, 'salary_structure_id');
    }

    public function payrollAllowances()
    {
        return $this->hasMany(PayrollAllowance::class, 'payroll_item_id');
    }

    public function payrollDeductions()
    {
        return $this->hasMany(PayrollDeduction::class, 'payroll_item_id');
    }

    public function payrollPayment()
    {
        return $this->hasOne(PayrollPayment::class, 'payroll_item_id', 'payroll_item_id');
    }

    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'user_id');
    }

    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->whereIn('status', ['draft', 'pending']);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeCalculated($query)
    {
        return $query->where('status', 'calculated');
    }

    public function scopeUnderReview($query)
    {
        return $query->where('status', 'under_review');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    // Helper methods — use stored column values, not relation sums
    public function getStoredTotalAllowancesAttribute()
    {
        return $this->attributes['total_allowances'] ?? 0;
    }

    public function getStoredTotalDeductionsAttribute()
    {
        return $this->attributes['deductions'] ?? 0;
    }

    public function getCalculatedNetPayAttribute()
    {
        return $this->gross_salary - ($this->attributes['deductions'] ?? 0);
    }
}