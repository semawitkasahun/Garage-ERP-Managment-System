<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SimpleSaleItem extends Model
{
    use HasFactory;

    protected $table = 'simple_sale_items';
    protected $primaryKey = 'item_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'sale_id',
        'inventory_item_id',
        'item_name',
        'quantity',
        'unit_price',
        'total',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Sale relationship
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(SimpleSale::class, 'sale_id', 'sale_id');
    }

    /**
     * Inventory item relationship (optional)
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
    }
}
?>
