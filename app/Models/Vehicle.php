<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $table = 'vehicles';
    protected $primaryKey = 'vehicle_id';

    protected $fillable = [
        'customer_id',
        'vin',
        'plate_number',
        'make',
        'model',
        'year',
        'engine_number',
        'chassis_number',
        'mileage',
        'warranty_expiry',
    ];

    protected $casts = [
        'year' => 'integer',
        'mileage' => 'integer',
        'warranty_expiry' => 'date',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id'); //this is the foreign key in the vehicles table and the primary key in the customers table
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'vehicle_id');
    }

    public function vehicleCheckins()
    {
        return $this->hasMany(VehicleCheckin::class, 'vehicle_id');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'vehicle_id');
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'vehicle_id');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'vehicle_id');
    }

    public function ownershipHistory()
    {
        return $this->hasMany(VehicleOwnershipHistory::class, 'vehicle_id');//has a many relationship with VehicleOwnershipHistory model, foreign key is vehicle_id in VehicleOwnershipHistory table
    }
}