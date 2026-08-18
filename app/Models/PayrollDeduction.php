<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollDeduction extends Model
{
    use HasFactory;

    protected $table = 'payroll_deductions';
    protected $primaryKey = 'payroll_deduction_id';

    protected $fillable = [
        'payroll_item_id',
        'deduction_id',
        'amount',
        'deduction_type',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    // Relationships
    public function payrollItem()
    {
        return $this->belongsTo(PayrollItem::class, 'payroll_item_id');
    }

    public function deduction()
    {
        return $this->belongsTo(Deduction::class, 'deduction_id');
    }
}
