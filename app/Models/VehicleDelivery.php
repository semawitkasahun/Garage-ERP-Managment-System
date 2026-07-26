<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleDelivery extends Model
{
    use HasFactory;

    protected $table = 'vehicle_deliveries';
    protected $primaryKey = 'delivery_id';

    protected $fillable = [
        'work_order_id',
        'delivered_by',
        'customer_signature_file',
        'delivery_checklist_notes',
        'feedback_rating',
        'feedback_comments',
        'delivered_at',
    ];

    protected $casts = [
        'feedback_rating' => 'integer',
        'delivered_at' => 'datetime',
    ];

    // Relationships
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }

    public function deliveredBy()
    {
        return $this->belongsTo(User::class, 'delivered_by', 'user_id');
    }
}