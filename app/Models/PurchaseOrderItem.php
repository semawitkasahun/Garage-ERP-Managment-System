<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    use HasFactory;

    protected $table = 'purchase_order_items';
    protected $primaryKey = 'po_item_id';

    protected $fillable = [
        'po_id',
        'item_id',
        'quantity_ordered',
        'unit_cost',
        'quantity_received',
    ];

    protected $casts = [
        'quantity_ordered' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'quantity_received' => 'decimal:2',
    ];

    // Relationships
    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id', 'po_id');
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }

    public function grnItems()
    {
        return $this->hasMany(GrnItem::class, 'po_item_id');
    }
}