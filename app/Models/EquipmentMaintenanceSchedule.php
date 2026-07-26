<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipmentMaintenanceSchedule extends Model
{
    use HasFactory;

    protected $table = 'equipment_maintenance_schedules';
    protected $primaryKey = 'schedule_id';

    protected $fillable = [
        'asset_id',
        'maintenance_type',
        'frequency_days',
        'last_performed',
        'next_due',
    ];

    protected $casts = [
        'frequency_days' => 'integer',
        'last_performed' => 'date',
        'next_due' => 'date',
    ];

    // Relationships
    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id', 'asset_id');
    }
}