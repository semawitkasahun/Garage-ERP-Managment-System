<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionItemResult extends Model
{
    use HasFactory;

    protected $table = 'checkin_inspection_item_results';
    protected $primaryKey = 'result_id';

    protected $fillable = [
        'inspection_id',
        'inspection_item_id',
        'status',
        'notes',
    ];

    public function inspection()
    {
        return $this->belongsTo(CheckinInspection::class, 'inspection_id');
    }

    public function inspectionItem()
    {
        return $this->belongsTo(InspectionItem::class, 'inspection_item_id');
    }

    public function photos()
    {
        return $this->hasMany(InspectionItemPhoto::class, 'inspection_result_id');
    }
}
