<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    use HasFactory;

    protected $table = 'stock_movements';
    protected $primaryKey = 'movement_id';

    protected $fillable = [
        'transaction_number',
        'item_id',
        'branch_id',
        'target_branch_id',
        'movement_type',
        'quantity',
        'previous_quantity',
        'new_quantity',
        'reference_type',
        'reference_id',
        'notes',
        'moved_by',
        'moved_at',
        'authorized_by',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'previous_quantity' => 'decimal:2',
        'new_quantity' => 'decimal:2',
        'moved_at' => 'datetime',
    ];

    // Relationships
    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function targetBranch()
    {
        return $this->belongsTo(Branch::class, 'target_branch_id', 'branch_id');
    }

    public function movedBy()
    {
        return $this->belongsTo(User::class, 'moved_by', 'user_id');
    }

    public function authorizedBy()
    {
        return $this->belongsTo(User::class, 'authorized_by', 'user_id');
    }
}