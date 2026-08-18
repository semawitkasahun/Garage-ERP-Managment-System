<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Allowance extends Model
{
    use HasFactory;

    protected $table = 'allowances';
    protected $primaryKey = 'allowance_id';

    protected $fillable = [
        'branch_id',
        'name',
        'code',
        'description',
        'amount',
        'calculation_type',
        'percentage_value',
        'is_taxable',
        'applies_to_all',
        'applicable_employee_ids',
        'applicable_department_ids',
        'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage_value' => 'decimal:2',
        'is_taxable' => 'boolean',
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

    public function payrollAllowances()
    {
        return $this->hasMany(PayrollAllowance::class, 'allowance_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeTaxable($query)
    {
        return $query->where('is_taxable', true);
    }

    public function scopeNonTaxable($query)
    {
        return $query->where('is_taxable', false);
    }

    public function scopeAppliesToAll($query)
    {
        return $query->where('applies_to_all', true);
    }
}
