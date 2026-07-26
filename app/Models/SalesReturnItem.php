<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesReturnItem extends Model
{
    use HasFactory;

    protected $table = 'sales_return_items';
    protected $primaryKey = 'sri_id';

    protected $fillable = [
        'sales_return_id',
        'item_id',
        'quantity_returned',
    ];

    protected $casts = [
        'quantity_returned' => 'decimal:2',
    ];

    // Relationships
    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class, 'sales_return_id', 'sales_return_id');
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }
}