<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $primaryKey = 'lead_id'; // your table's actual PK — without this, route-model-binding fatal-errors

    protected $fillable = [
        'customer_id',
        'source',
        'status',
        'assigned_to',
        'name',
        'company',
        'phone',
        'email',
        'address',
        'interested_service',
        'expected_budget',
        'preferred_contact_method',
        'priority',
        'notes',
        'vehicle_make',
        'vehicle_model',
        'vehicle_year',
        'vehicle_plate',
        'vehicle_vin',
        'interest_level',
        'urgency',
        'is_decision_maker',
        'expected_service_date',
    ];

    protected $casts = [
        'expected_budget' => 'decimal:2',
        'is_decision_maker' => 'boolean',
        'expected_service_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to', 'user_id');
    }

    public function followups()
    {
        return $this->hasMany(LeadFollowup::class, 'lead_id', 'lead_id');
    }
}