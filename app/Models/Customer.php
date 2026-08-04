<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'customers';
    protected $primaryKey = 'customer_id';

    protected $fillable = [
        'first_name',
        'last_name',
        'customer_type',
        'phone',
        'email',
        'address',
        'segment',
        'branch_id',
        'opt_in_sms',
        'opt_in_email',
    ];

    protected $casts = [
        'opt_in_sms' => 'boolean',
        'opt_in_email' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class, 'customer_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'customer_id');
    }

    public function leads()
    {
        return $this->hasMany(Lead::class, 'customer_id');
    }

    public function complaints()
    {
        return $this->hasMany(ComplaintFeedback::class, 'customer_id');
    }

    public function communicationLogs()
    {
        return $this->hasMany(CommunicationLog::class, 'customer_id');
    }

    public function quotations()
    {
        return $this->hasMany(Quotation::class, 'customer_id');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'customer_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'customer_id');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'customer_id');
    }

    public function vehicleCheckins()
    {
        return $this->hasMany(VehicleCheckin::class, 'customer_id');
    }
}