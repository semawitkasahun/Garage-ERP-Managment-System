<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LeadFollowup extends Model
{
    protected $primaryKey = 'followup_id';

    protected $fillable = [
        'lead_id',
        'scheduled_at',
        'method',
        'notes',
        'next_followup_date',
        'created_by',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'next_followup_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id', 'lead_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}