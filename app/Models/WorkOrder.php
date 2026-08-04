<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOrder extends Model
{
    use HasFactory;

    protected $table = 'work_orders';
    protected $primaryKey = 'work_order_id';

    protected $fillable = [
        'quotation_id',
        'vehicle_id',
        'customer_id',
        'branch_id',
        'status',
        'completed_at',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'quotation_id');//what quotation is associated with this work order through the quotation_id foreign key and a work order can have one quotation because a quotation can be generated from an inspection and a quotation can be generated from a vehicle checkin without an inspection this is why the quotations table has both inspection_id and checkin_id foreign keys
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function jobCards()
    {
        return $this->hasMany(JobCard::class, 'work_order_id');//what job cards are associated with this work order through the work_order_id foreign key and a work order can have multiple job cards because a work order can have multiple inspections and each inspection can have multiple job cards
    }
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }

    public function delivery()
    {
        return $this->hasOne(VehicleDelivery::class, 'work_order_id');
    }
}