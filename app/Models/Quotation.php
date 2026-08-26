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
        'checkin_id',
        'work_order_id',
        'vehicle_id',
        'customer_id',
        'revision_no',
        'status',
        'customer_approval_status',
        'customer_approved_at',
        'customer_approved_by',
        'sent_to_customer_at',
        'sent_via',
        'rejection_reason',
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
        'customer_approved_at' => 'datetime',
        'sent_to_customer_at' => 'datetime',
    ];

    // Relationships
    public function inspection()
    {
        return $this->belongsTo(Inspection::class, 'inspection_id', 'inspection_id');
    }

    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id', 'checkin_id');
    }

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
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

    public function customerApprovedBy()
    {
        return $this->belongsTo(User::class, 'customer_approved_by', 'user_id');
    }

    public function items()
    {
        return $this->hasMany(QuotationItem::class, 'quotation_id');
    }
}