<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOrderSupplement extends Model
{
    use HasFactory;

    protected $table = 'work_order_supplements';
    protected $primaryKey = 'supplement_id';

    protected $fillable = [
        'work_order_id',
        'quotation_id',
        'supplement_number',
        'reason',
        'description',
        'additional_cost',
        'status',
        'created_by',
        'customer_approved_at',
        'rejection_reason',
    ];

    protected $casts = [
        'customer_approved_at' => 'datetime',
        'additional_cost' => 'decimal:2',
    ];

    // Relationships
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }

    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'quotation_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }

    // Helper methods
    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    public function isPending()
    {
        return in_array($this->status, ['draft', 'sent']);
    }
}