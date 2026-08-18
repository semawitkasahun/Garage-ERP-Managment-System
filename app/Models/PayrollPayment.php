<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPayment extends Model
{
    use HasFactory;

    protected $table = 'payroll_payments';
    protected $primaryKey = 'payroll_payment_id';

    protected $fillable = [
        'payroll_item_id',
        'employee_id',
        'payroll_period_id',
        'amount',
        'payment_method',
        'payment_date',
        'payment_reference',
        'receipt_number',
        'notes',
        'processed_by',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
    ];

    // Relationships
    public function payrollItem()
    {
        return $this->belongsTo(PayrollItem::class, 'payroll_item_id', 'payroll_item_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id', 'payroll_period_id');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by', 'user_id');
    }

    // Generate receipt number
    public static function generateReceiptNumber()
    {
        $latest = static::latest('payroll_payment_id')->first();
        $nextId = $latest ? $latest->payroll_payment_id + 1 : 1;
        return 'RCP-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }
}
