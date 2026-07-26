<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierPerformanceScore extends Model
{
    use HasFactory;

    protected $table = 'supplier_performance_scores';
    protected $primaryKey = 'score_id';

    protected $fillable = [
        'supplier_id',
        'period',
        'on_time_delivery_pct',
        'quality_score',
        'pricing_score',
    ];

    protected $casts = [
        'on_time_delivery_pct' => 'decimal:2',
        'quality_score' => 'decimal:2',
        'pricing_score' => 'decimal:2',
    ];

    // Relationships
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }
}