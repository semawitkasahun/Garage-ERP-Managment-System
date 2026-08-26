<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckinInspection extends Model
{
    use HasFactory;

    protected $table = 'checkin_inspections';
    protected $primaryKey = 'inspection_id';

    protected $fillable = [
        'checkin_id',
        'inspector_id',
        'started_at',
        'completed_at',
        'general_notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id');
    }

    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function itemResults()
    {
        return $this->hasMany(InspectionItemResult::class, 'inspection_id');
    }
}
