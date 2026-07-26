<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPriceListItem extends Model
{
    use HasFactory;

    protected $table = 'supplier_price_list_items';
    protected $primaryKey = 'pli_id';

    protected $fillable = [
        'price_list_id',
        'item_id',
        'unit_price',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
    ];

    // Relationships
    public function priceList()
    {
        return $this->belongsTo(SupplierPriceList::class, 'price_list_id', 'price_list_id');
    }

    public function item()
    {
        return $this->belongsTo(InventoryItem::class, 'item_id', 'item_id');
    }
}