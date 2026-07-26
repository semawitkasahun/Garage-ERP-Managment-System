<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckinChecklistItem extends Model
{
    use HasFactory;

    protected $table = 'checkin_checklist_items';
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'checkin_id',
        'item_name',
        'status',
        'notes',
    ];

    // Relationships
    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id', 'checkin_id');
    }
}