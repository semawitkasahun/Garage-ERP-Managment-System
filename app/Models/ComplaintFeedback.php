<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplaintFeedback extends Model
{
    use HasFactory;

    protected $table = 'complaints_feedback';
    protected $primaryKey = 'feedback_id';

    protected $fillable = [
        'customer_id',
        'related_entity_type',
        'related_entity_id',
        'type',
        'description',
        'status',
        'resolution',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }
}