<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionItem extends Model
{
    use HasFactory;

    protected $table = 'inspection_items';
    protected $primaryKey = 'item_id';

    protected $fillable = [
        'category_id',
        'name',
        'display_name',
        'sort_order',
        'is_required',
    ];

    public function category()
    {
        return $this->belongsTo(InspectionCategory::class, 'category_id');
    }
}
