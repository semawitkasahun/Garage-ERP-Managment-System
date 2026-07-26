<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LaborLog extends Model
{
    use HasFactory;

    protected $table = 'labor_logs';
    protected $primaryKey = 'labor_log_id';

    protected $fillable = [
        'task_id',
        'technician_id',
        'clock_in',
        'clock_out',
        'hours_logged',
        'hourly_rate',
        'labor_cost',
    ];

    protected $casts = [
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'hours_logged' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'labor_cost' => 'decimal:2',
    ];

    // Relationships
    public function task()
    {
        return $this->belongsTo(JobCardTask::class, 'task_id', 'task_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id', 'user_id');
    }
}