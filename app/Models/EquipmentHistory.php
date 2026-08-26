<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentHistory extends Model
{
    use HasFactory;

    protected $table = 'equipment_histories';

    protected $fillable = [
        'equipment_id',
        'event_type',
        'title',
        'description',
        'performed_by',
        'metadata',
        'event_date',
    ];

    protected $casts = [
        'metadata' => 'array',
        'event_date' => 'datetime',
    ];

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }
}
