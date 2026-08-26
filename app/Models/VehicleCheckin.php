<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleCheckin extends Model
{
    use HasFactory;

    protected $table = 'vehicle_checkins';
    protected $primaryKey = 'checkin_id';
    public $timestamps = false; // no created_at/updated_at columns on this table — only checked_in_at

    protected $fillable = [
        'appointment_id',
        'vehicle_id',
        'customer_id',
        'branch_id',
        'mileage_in',
        'fuel_level',
        'customer_complaint',
        'signature_file',
        'key_tag_number',
        'checked_in_by',
        'checked_in_at',
    ];

    protected $casts = [
        'checked_in_at' => 'datetime',
    ];

    // Relationships
    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
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

    public function checkedInBy()
    {
        return $this->belongsTo(User::class, 'checked_in_by', 'user_id');
    }

    public function checklistItems()
    {
        return $this->hasMany(CheckinChecklistItem::class, 'checkin_id');
    }

    public function media()
    {
        return $this->hasMany(CheckinMedia::class, 'checkin_id');
    }

    public function inspections()
    {
        return $this->hasMany(Inspection::class, 'checkin_id');
    }

    public function checkinInspection()
    {
        return $this->hasOne(CheckinInspection::class, 'checkin_id');
    }

    public function damageRecords()
    {
        return $this->hasMany(VehicleDamageRecord::class, 'checkin_id');
    }

    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id');
    }
}