<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckinMedia extends Model
{
    use HasFactory;

    protected $table = 'checkin_media';
    protected $primaryKey = 'media_id';

    protected $fillable = [
        'checkin_id',
        'file_path',
        'media_type',
        'captured_at',
    ];

    protected $casts = [
        'captured_at' => 'datetime',
    ];

    // Relationships
    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id', 'checkin_id');
    }
}