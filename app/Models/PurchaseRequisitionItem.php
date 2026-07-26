<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequisitionItem extends Model
{
    use HasFactory;

    protected $table = 'purchase_requisition_items';
    protected $primaryKey = 'pr_item_id';

    protected $fillable = [
        'requisition_id',
        'item_id',
        'quantity_requested',
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
    ];

    // Relationships
    public function requisition()
    {
        return $this->belongsTo(PurchaseRequisition::class, 'requisition_id', 'requisition_id');
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }
}