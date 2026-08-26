<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOrderActivity extends Model
{
    use HasFactory;

    protected $table = 'work_order_activities';
    protected $primaryKey = 'activity_id';

    protected $fillable = [
        'work_order_id',
        'job_card_id',
        'action',
        'description',
        'performed_by',
        'performed_at',
        'old_values',
        'new_values',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    // Relationships
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by', 'user_id');
    }
}