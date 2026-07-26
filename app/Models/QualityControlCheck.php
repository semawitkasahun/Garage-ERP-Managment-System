<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityControlCheck extends Model
{
    use HasFactory;

    protected $table = 'quality_control_checks';
    protected $primaryKey = 'qc_id';

    protected $fillable = [
        'job_card_id',
        'inspector_id',
        'result',
        'notes',
        'checked_at',
    ];

    protected $casts = [
        'checked_at' => 'datetime',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id', 'user_id');
    }

    public function checklistItems()
    {
        return $this->hasMany(QcChecklistItem::class, 'qc_id');
    }
}