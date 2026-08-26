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
        'item_code',
        'sku',
        'name',
        'brand',
        'part_number',
        'description',
        'category',
        'unit_of_measure',
        'cost_price',
        'sell_price',
        'reorder_point',
        'unit',
        'current_quantity',
        'minimum_stock',
        'reorder_quantity',
        'unit_cost',
        'selling_price',
        'storage_location',
        'storage_location_id',
        'supplier_id',
        'status',
        'notes',
        'is_serialized',
        'is_batch_tracked',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'current_quantity' => 'decimal:2',
        'minimum_stock' => 'decimal:2',
        'reorder_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'is_serialized' => 'boolean',
        'is_batch_tracked' => 'boolean',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function storageLocation()
    {
        return $this->belongsTo(StorageLocation::class, 'storage_location_id');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'inventory_item_id', 'item_id')->latest();
    }

    public function partRequests()
    {
        return $this->hasMany(JobCardPartRequest::class, 'inventory_item_id', 'item_id');
    }

    public function refreshStatus(): void
    {
        $status = match (true) {
            $this->status === 'Inactive' || $this->is_active === false => 'Inactive',
            (float) $this->current_quantity <= 0 => 'Out of Stock',
            (float) $this->current_quantity <= (float) ($this->minimum_stock ?? $this->reorder_point ?? 0) => 'Low Stock',
            default => 'In Stock',
        };

        if ($this->status !== $status) {
            $this->update(['status' => $status]);
        }
    }

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