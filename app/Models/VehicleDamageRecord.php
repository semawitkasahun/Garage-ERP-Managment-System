<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleDamageRecord extends Model
{
    use HasFactory;

    protected $table = 'vehicle_damage_records';
    protected $primaryKey = 'damage_id';

    protected $fillable = [
        'checkin_id',
        'damage_type',
        'location',
        'description',
        'photo_path',
        'is_existing_damage',
    ];

    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id');
    }
}
