<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deduction extends Model
{
    use HasFactory;

    protected $table = 'deductions';
    protected $primaryKey = 'deduction_id';

    protected $fillable = [
        'branch_id',
        'name',
        'code',
        'description',
        'amount',
        'calculation_type',
        'percentage_value',
        'priority',
        'deduction_type',
        'applies_to_all',
        'applicable_employee_ids',
        'applicable_department_ids',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage_value' => 'decimal:2',
        'priority' => 'integer',
        'applies_to_all' => 'boolean',
        'applicable_employee_ids' => 'array',
        'applicable_department_ids' => 'array',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function payrollDeductions()
    {
        return $this->hasMany(PayrollDeduction::class, 'deduction_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByPriority($query)
    {
        return $query->orderBy('priority', 'desc');
    }

    public function scopeTax($query)
    {
        return $query->where('deduction_type', 'tax');
    }

    public function scopePension($query)
    {
        return $query->where('deduction_type', 'pension');
    }

    public function scopeLoan($query)
    {
        return $query->where('deduction_type', 'loan');
    }

    public function scopeAdvance($query)
    {
        return $query->where('deduction_type', 'advance');
    }
}
