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
    ];

    protected $casts = [
        'base_pay' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
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
}