<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardTask extends Model
{
    use HasFactory;

    protected $table = 'job_card_tasks';
    protected $primaryKey = 'task_id';

    protected $fillable = [
        'job_card_id',
        'quotation_item_id',
        'technician_id',
        'task_description',
        'estimated_hours',
        'status',
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'estimated_hours' => 'decimal:2',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function quotationItem()
    {
        return $this->belongsTo(QuotationItem::class, 'quotation_item_id', 'quotation_item_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id', 'user_id');
    }

    public function laborLogs()
    {
        return $this->hasMany(LaborLog::class, 'task_id');
    }

    public function partsRequisitions()
    {
        return $this->hasMany(PartsRequisition::class, 'task_id');
    }
}