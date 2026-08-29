<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashBankTransaction extends Model
{
    use HasFactory;

    protected $table = 'cash_bank_transactions';
    protected $primaryKey = 'id';

    protected $fillable = [
        'transaction_date',
        'description',
        'type',
        'account',
        'amount',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'amount' => 'decimal:2',
    ];
}
