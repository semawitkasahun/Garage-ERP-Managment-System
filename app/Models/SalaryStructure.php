<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalaryStructure extends Model
{
    use HasFactory;

    protected $table = 'salary_structures';
    protected $primaryKey = 'salary_structure_id';

    protected $fillable = [
        'branch_id',
        'department_id',
        'name',
        'code',
        'description',
        'basic_salary',
        'salary_type',
        'payment_frequency',
        'overtime_rate',
        'overtime_calculation',
        'tax_rate',
        'taxable',
        'working_days_per_month',
        'working_hours_per_day',
        'is_active',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'overtime_rate' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    public function employeeSalaryStructures()
    {
        return $this->hasMany(EmployeeSalaryStructure::class, 'salary_structure_id');
    }

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class, 'salary_structure_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }
}
