<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Quotation extends Model
{
    use HasFactory;

    protected $table = 'quotations';
    protected $primaryKey = 'quotation_id';

    protected $fillable = [
        'inspection_id',
        'vehicle_id',
        'customer_id',
        'revision_no',
        'status',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'created_by',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    // Relationships
    public function inspection()
    {
        return $this->belongsTo(Inspection::class, 'inspection_id', 'inspection_id');//inspection_id is the foreign key in the quotations table that references the inspection_id in the inspections table
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class, 'quotation_id');
    }

    public function workOrder()
    {
        return $this->hasOne(WorkOrder::class, 'quotation_id');//a quotation can generate a work order and a work order can be generated from a quotation this is why the work_orders table has a quotation_id foreign key
    }
}