<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PartsRequisition extends Model
{
    use HasFactory;

    protected $table = 'parts_requisitions';
    protected $primaryKey = 'requisition_id';

    protected $fillable = [
        'job_card_id',
        'task_id',
        'inventory_item_id',
        'quantity_requested',
        'quantity_issued',
        'status',
        'requested_by',
        'requested_at',
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
        'quantity_issued' => 'decimal:2',
        'requested_at' => 'datetime',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function task()
    {
        return $this->belongsTo(JobCardTask::class, 'task_id', 'task_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by', 'user_id');
    }
}
