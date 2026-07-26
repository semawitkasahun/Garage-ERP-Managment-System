<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryItem extends Model
{
    use HasFactory;

    protected $table = 'inventory_items';
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'sku',
        'name',
        'description',
        'category',
        'unit_of_measure',
        'cost_price',
        'sell_price',
        'reorder_point',
        'is_serialized',
        'is_batch_tracked',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'is_serialized' => 'boolean',
        'is_batch_tracked' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function stock()
    {
        return $this->hasMany(InventoryStock::class, 'item_id');
    }

    public function batches()
    {
        return $this->hasMany(StockBatch::class, 'item_id');
    }

    public function movements()
    {
        return $this->hasMany(StockMovement::class, 'item_id');
    }

    public function transfers()
    {
        return $this->hasMany(StockTransfer::class, 'item_id');
    }

    public function countItems()
    {
        return $this->hasMany(StockCountItem::class, 'item_id');
    }

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class, 'inventory_item_id');
    }

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class, 'item_id');
    }

    public function salesOrderItems()
    {
        return $this->hasMany(SalesOrderItem::class, 'item_id');
    }

    public function supplierPriceListItems()
    {
        return $this->hasMany(SupplierPriceListItem::class, 'item_id');
    }

    public function purchaseRequisitionItems()
    {
        return $this->hasMany(PurchaseRequisitionItem::class, 'item_id');
    }
}