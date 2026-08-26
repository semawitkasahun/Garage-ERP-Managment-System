<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardQcResult extends Model
{
    use HasFactory;

    protected $table = 'job_card_qc_results';
    protected $primaryKey = 'qc_result_id';

    protected $fillable = [
        'job_card_id',
        'inspector_id',
        'qc_status',
        'qc_notes',
        'qc_performed_at',
    ];

    protected $casts = [
        'qc_performed_at' => 'datetime',
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
}