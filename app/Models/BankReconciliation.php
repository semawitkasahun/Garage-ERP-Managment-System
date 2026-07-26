<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankReconciliation extends Model
{
    use HasFactory;

    protected $table = 'bank_reconciliations';
    protected $primaryKey = 'reconciliation_id';

    protected $fillable = [
        'bank_account_id',
        'statement_date',
        'statement_balance',
        'book_balance',
        'reconciled_by',
        'reconciled_at',
    ];

    protected $casts = [
        'statement_date' => 'date',
        'statement_balance' => 'decimal:2',
        'book_balance' => 'decimal:2',
        'reconciled_at' => 'datetime',
    ];

    // Relationships
    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id', 'bank_account_id');
    }

    public function reconciledBy()
    {
        return $this->belongsTo(User::class, 'reconciled_by', 'user_id');
    }
}