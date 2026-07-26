<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    use HasFactory;

    protected $table = 'purchase_orders';
    protected $primaryKey = 'po_id';

    protected $fillable = [
        'supplier_id',
        'branch_id',
        'requisition_id',
        'status',
        'approved_by',
        'order_date',
        'expected_date',
        'freight_cost',
        'tax_amount',
        'total_amount',
    ];

    protected $casts = [
        'order_date' => 'date',
        'expected_date' => 'date',
        'freight_cost' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function requisition()
    {
        return $this->belongsTo(PurchaseRequisition::class, 'requisition_id', 'requisition_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseOrderItem::class, 'po_id');
    }

    public function goodsReceivedNotes()
    {
        return $this->hasMany(GoodsReceivedNote::class, 'po_id');
    }

    public function returns()
    {
        return $this->hasMany(PurchaseReturn::class, 'po_id');
    }
}