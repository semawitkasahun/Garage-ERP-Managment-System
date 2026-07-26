<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockCount extends Model
{
    use HasFactory;

    protected $table = 'stock_counts';
    protected $primaryKey = 'count_id';

    protected $fillable = [
        'branch_id',
        'status',
        'scheduled_date',
        'completed_at',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function items()
    {
        return $this->hasMany(StockCountItem::class, 'count_id');
    }
}