<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GeneralLedgerEntry extends Model
{
    use HasFactory;

    protected $table = 'general_ledger_entries';
    protected $primaryKey = 'gl_entry_id';

    protected $fillable = [
        'account_id',
        'branch_id',
        'reference_type',
        'reference_id',
        'debit',
        'credit',
        'entry_date',
        'created_by',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'entry_date' => 'date',
    ];

    // Relationships
    public function account()
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id', 'account_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}