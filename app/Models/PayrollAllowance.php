<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollAllowance extends Model
{
    use HasFactory;

    protected $table = 'payroll_allowances';
    protected $primaryKey = 'payroll_allowance_id';

    protected $fillable = [
        'payroll_item_id',
        'allowance_id',
        'amount',
        'is_taxable',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_taxable' => 'boolean',
    ];

    // Relationships
    public function payrollItem()
    {
        return $this->belongsTo(PayrollItem::class, 'payroll_item_id');
    }

    public function allowance()
    {
        return $this->belongsTo(Allowance::class, 'allowance_id');
    }
}
