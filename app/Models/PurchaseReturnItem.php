<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseReturnItem extends Model
{
    use HasFactory;

    protected $table = 'purchase_return_items';
    protected $primaryKey = 'return_item_id';

    protected $fillable = [
        'return_id',
        'item_id',
        'quantity_returned',
    ];

    protected $casts = [
        'quantity_returned' => 'decimal:2',
    ];

    // Relationships
    public function purchaseReturn()
    {
        return $this->belongsTo(PurchaseReturn::class, 'return_id', 'return_id');
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }
}