<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SimplePurchaseItem extends Model
{
    use HasFactory;

    protected $table = 'simple_purchase_items';
    protected $primaryKey = 'purchase_item_id';

    protected $fillable = [
        'purchase_id',
        'item_name',
        'quantity',
        'unit_price',
        'total',
        'inventory_item_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function purchase()
    {
        return $this->belongsTo(SimplePurchase::class, 'purchase_id', 'purchase_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
    }
}
