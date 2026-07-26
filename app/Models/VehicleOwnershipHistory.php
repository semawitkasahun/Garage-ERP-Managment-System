<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleOwnershipHistory extends Model
{
    use HasFactory;

    protected $table = 'vehicle_ownership_history';
    protected $primaryKey = 'history_id';

    protected $fillable = [
        'vehicle_id',
        'customer_id',
        'owned_from',
        'owned_to',
    ];

    protected $casts = [
        'owned_from' => 'date',
        'owned_to' => 'date',
    ];

    // Relationships
    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }
}