<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QuotationItem extends Model
{
    use HasFactory;

    protected $table = 'quotation_items';
    protected $primaryKey = 'quotation_item_id';

    protected $fillable = [
        'quotation_id',
        'finding_id',
        'item_type',
        'inventory_item_id',
        'description',
        'quantity',
        'unit_price',
        'tax_amount',
        'discount_amount',
        'line_total',
        'approval_status',
        'approved_via',
        'approved_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
        'approved_at' => 'datetime',
    ];

    // Relationships
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'quotation_id');
    }

    public function finding()
    {
        return $this->belongsTo(InspectionFinding::class, 'finding_id', 'finding_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
    }

    public function jobCardTasks()
    {
        return $this->hasMany(JobCardTask::class, 'quotation_item_id');
    }
}