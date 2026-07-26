<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCountItem extends Model
{
    use HasFactory;

    protected $table = 'stock_count_items';
    protected $primaryKey = 'count_item_id';

    protected $fillable = [
        'count_id',
        'item_id',
        'system_qty',
        'counted_qty',
        'variance',
    ];

    protected $casts = [
        'system_qty' => 'decimal:2',
        'counted_qty' => 'decimal:2',
        'variance' => 'decimal:2',
    ];

    // Relationships
    public function stockCount()
    {
        return $this->belongsTo(StockCount::class, 'count_id', 'count_id');
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }
}