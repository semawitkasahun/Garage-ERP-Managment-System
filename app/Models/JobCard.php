<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCard extends Model
{
    use HasFactory;

    protected $table = 'job_cards';
    protected $primaryKey = 'job_card_id';

    protected $fillable = [
        'work_order_id',
        'description',
        'status',
        'priority',
    ];

    // Relationships
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }

    public function tasks()
    {
        return $this->hasMany(JobCardTask::class, 'job_card_id');
    }

    public function partsRequisitions()
    {
        return $this->hasMany(PartsRequisition::class, 'job_card_id');
    }

    public function qualityControlChecks()
    {
        return $this->hasMany(QualityControlCheck::class, 'job_card_id');
    }

    public function equipmentBookings()
    {
        return $this->hasMany(EquipmentBooking::class, 'job_card_id');
    }
}