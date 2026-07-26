<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $table = 'assets';
    protected $primaryKey = 'asset_id';

    protected $fillable = [
        'branch_id',
        'name',
        'category',
        'purchase_date',
        'purchase_cost',
        'depreciation_method',
        'useful_life_years',
        'current_value',
        'status',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_cost' => 'decimal:2',
        'useful_life_years' => 'integer',
        'current_value' => 'decimal:2',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function maintenanceSchedules()
    {
        return $this->hasMany(EquipmentMaintenanceSchedule::class, 'asset_id');
    }

    public function bookings()
    {
        return $this->hasMany(EquipmentBooking::class, 'asset_id');
    }

    public function depreciationRecords()
    {
        return $this->hasMany(AssetDepreciationRecord::class, 'asset_id');
    }
}