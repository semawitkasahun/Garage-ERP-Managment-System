<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    use HasFactory;

    protected $table = 'budgets';
    protected $primaryKey = 'budget_id';

    protected $fillable = [
        'branch_id',
        'account_id',
        'period',
        'budget_amount',
        'actual_amount',
    ];

    protected $casts = [
        'budget_amount' => 'decimal:2',
        'actual_amount' => 'decimal:2',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function account()
    {
        return $this->belongsTo(ChartOfAccount::class, 'account_id', 'account_id');
    }
}