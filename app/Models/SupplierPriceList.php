<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPriceList extends Model
{
    use HasFactory;

    protected $table = 'supplier_price_lists';
    protected $primaryKey = 'price_list_id';

    protected $fillable = [
        'supplier_id',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'effective_to' => 'date',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(SupplierPriceListItem::class, 'price_list_id');
    }
}