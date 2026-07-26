<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QcChecklistItem extends Model
{
    use HasFactory;

    protected $table = 'qc_checklist_items';
    protected $primaryKey = 'qc_item_id';

    protected $fillable = [
        'qc_id',
        'item_name',
        'status',
        'notes',
    ];

    // Relationships
    public function qualityControlCheck()
    {
        return $this->belongsTo(QualityControlCheck::class, 'qc_id', 'qc_id');
    }
}