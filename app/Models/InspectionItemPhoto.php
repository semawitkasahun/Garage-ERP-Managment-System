<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionItemPhoto extends Model
{
    use HasFactory;

    protected $table = 'inspection_item_photos';
    protected $primaryKey = 'photo_id';

    protected $fillable = [
        'inspection_result_id',
        'file_path',
        'file_name',
        'mime_type',
        'file_size',
    ];

    public function inspectionResult()
    {
        return $this->belongsTo(InspectionItemResult::class, 'inspection_result_id');
    }
}
