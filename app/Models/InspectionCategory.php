<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionCategory extends Model
{
    use HasFactory;

    protected $table = 'inspection_categories';
    protected $primaryKey = 'category_id';

    protected $fillable = [
        'name',
        'display_name',
        'sort_order',
    ];

    public function items()
    {
        return $this->hasMany(InspectionItem::class, 'category_id');
    }
}
