<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardPart extends Model
{
    use HasFactory;

    protected $table = 'job_card_parts';
    protected $primaryKey = 'job_card_part_id';

    protected $fillable = [
        'job_card_id',
        'inventory_item_id',
        'part_name',
        'requested_quantity',
        'issued_quantity',
        'used_quantity',
        'returned_quantity',
        'unit_cost',
        'total_cost',
        'notes',
    ];

    protected $casts = [
        'requested_quantity' => 'decimal:2',
        'issued_quantity' => 'decimal:2',
        'used_quantity' => 'decimal:2',
        'returned_quantity' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
    ];

    // Relationships
    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
    }
}