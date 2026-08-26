<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardLabor extends Model
{
    use HasFactory;

    protected $table = 'job_card_labor';
    protected $primaryKey = 'labor_id';

    protected $fillable = [
        'job_card_id',
        'technician_id',
        'start_time',
        'end_time',
        'hours_worked',
        'hourly_rate',
        'labor_cost',
        'notes',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'hours_worked' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'labor_cost' => 'decimal:2',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id', 'user_id');
    }
}