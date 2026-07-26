<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    protected $table = 'suppliers';
    protected $primaryKey = 'supplier_id';

    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'address',
        'payment_terms',
        'lead_time_days',
    ];

    protected $casts = [
        'lead_time_days' => 'integer',
    ];

    // Relationships
    public function priceLists()
    {
        return $this->hasMany(SupplierPriceList::class, 'supplier_id');
    }

    public function performanceScores()
    {
        return $this->hasMany(SupplierPerformanceScore::class, 'supplier_id');
    }

    public function contracts()
    {
        return $this->hasMany(SupplierContract::class, 'supplier_id');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'supplier_id');
    }

    public function purchaseReturns()
    {
        return $this->hasMany(PurchaseReturn::class, 'supplier_id');
    }
}