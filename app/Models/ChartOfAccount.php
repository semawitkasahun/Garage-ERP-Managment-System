<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    use HasFactory;

    protected $table = 'chart_of_accounts';
    protected $primaryKey = 'account_id';

    protected $fillable = [
        'code',
        'name',
        'account_type',
        'parent_account_id',
    ];

    // Relationships
    public function parent()
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_account_id', 'account_id');
    }

    public function children()
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_account_id', 'account_id');
    }

    public function ledgerEntries()
    {
        return $this->hasMany(GeneralLedgerEntry::class, 'account_id');//the general ledger entries that belong to this account will be retrieved using the account_id foreign key in the general_ledger_entries table.
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class, 'account_id');
    }
}