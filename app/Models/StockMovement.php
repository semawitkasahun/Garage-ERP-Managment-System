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
        'item_id',
        'branch_id',
        'movement_type',
        'quantity',
        'reference_type',
        'reference_id',
        'moved_by',
        'moved_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
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

    public function movedBy()
    {
        return $this->belongsTo(User::class, 'moved_by', 'user_id');
    }
}