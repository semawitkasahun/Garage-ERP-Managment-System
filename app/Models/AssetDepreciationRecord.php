<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssetDepreciationRecord extends Model
{
    use HasFactory;

    protected $table = 'asset_depreciation_records';
    protected $primaryKey = 'record_id';

    protected $fillable = [
        'asset_id',
        'period',
        'depreciation_amount',
        'book_value',
    ];

    protected $casts = [
        'depreciation_amount' => 'decimal:2',
        'book_value' => 'decimal:2',
    ];

    // Relationships
    public function asset()
    {
        return $this->belongsTo(Asset::class, 'asset_id', 'asset_id');
    }
}