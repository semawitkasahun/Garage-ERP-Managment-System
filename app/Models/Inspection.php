<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inspection extends Model
{
    use HasFactory;

    protected $table = 'inspections';
    protected $primaryKey = 'inspection_id';

    protected $fillable = [
        'checkin_id',
        'vehicle_id',
        'technician_id',
        'service_type',
        'status',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id', 'checkin_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id', 'user_id');
    }

    public function findings()
    {
        return $this->hasMany(InspectionFinding::class, 'inspection_id');//what inspection findings are associated with this inspection through the inspection_id foreign key
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'inspection_id');//what quotations are associated with this inspection through the inspection_id foreign key because a quotation can be generated from an inspection and a quotation can be generated from a vehicle checkin without an inspection this is why the quotations table has both inspection_id and checkin_id foreign keys
    }
}