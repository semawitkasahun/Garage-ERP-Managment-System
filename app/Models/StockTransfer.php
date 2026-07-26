<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockTransfer extends Model
{
    use HasFactory;

    protected $table = 'stock_transfers';
    protected $primaryKey = 'transfer_id';

    protected $fillable = [
        'item_id',
        'from_branch_id',
        'to_branch_id',
        'quantity',
        'status',
        'requested_by',
        'transferred_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'transferred_at' => 'datetime',
    ];

    // Relationships
    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }

    public function fromBranch()
    {
        return $this->belongsTo(Branch::class, 'from_branch_id', 'branch_id');
    }

    public function toBranch()
    {
        return $this->belongsTo(Branch::class, 'to_branch_id', 'branch_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by', 'user_id');
    }
}