<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BankAccount extends Model
{
    use HasFactory;

    protected $table = 'bank_accounts';
    protected $primaryKey = 'bank_account_id';

    protected $fillable = [
        'branch_id',
        'bank_name',
        'account_number',
        'currency',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function reconciliations()
    {
        return $this->hasMany(BankReconciliation::class, 'bank_account_id'); // bankReconciliation_id is the foreign key in the BankReconciliation model which references the bank_account_id in the BankAccount model. This relationship allows you to retrieve all bank reconciliations associated with a specific bank account.
    }
}