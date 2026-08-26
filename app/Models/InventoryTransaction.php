<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryTransaction extends Model
{
  public const TYPES = ['Receive', 'Issue', 'Return', 'Transfer', 'Adjustment'];

  protected $fillable = [
    'transaction_code',
    'inventory_item_id',
    'type',
    'quantity',
    'previous_quantity',
    'new_quantity',
    'reason',
    'reference',
    'work_order_id',
    'job_card_id',
    'from_location_id',
    'to_location_id',
    'performed_by',
  ];

  protected $casts = [
    'quantity' => 'decimal:2',
    'previous_quantity' => 'decimal:2',
    'new_quantity' => 'decimal:2',
  ];

  protected static function booted(): void
  {
    static::creating(function (InventoryTransaction $transaction) {
      if (empty($transaction->transaction_code)) {
        $next = (static::max('id') ?? 0) + 1;
        $transaction->transaction_code = 'TX-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
      }
    });
  }

  public function item(): BelongsTo
  {
    return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
  }

  public function performedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'performed_by', 'employee_id');
  }

  public function fromLocation(): BelongsTo
  {
    return $this->belongsTo(StorageLocation::class, 'from_location_id');
  }

  public function toLocation(): BelongsTo
  {
    return $this->belongsTo(StorageLocation::class, 'to_location_id');
  }

  public function workOrder(): BelongsTo
  {
    return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
  }

  public function jobCard(): BelongsTo
  {
    return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
  }
}
