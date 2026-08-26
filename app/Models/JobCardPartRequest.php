<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobCardPartRequest extends Model
{
  public const STATUSES = ['Pending', 'Approved', 'Rejected', 'Issued', 'Partially Returned', 'Returned', 'Cancelled'];

  protected $fillable = [
    'job_card_id',
    'work_order_id',
    'inventory_item_id',
    'requested_by',
    'requested_quantity',
    'approved_quantity',
    'issued_quantity',
    'returned_quantity',
    'status',
    'reason',
    'approved_by',
    'approved_at',
    'issued_by',
    'issued_at',
  ];

  protected $casts = [
    'requested_quantity' => 'decimal:2',
    'approved_quantity' => 'decimal:2',
    'issued_quantity' => 'decimal:2',
    'returned_quantity' => 'decimal:2',
    'approved_at' => 'datetime',
    'issued_at' => 'datetime',
  ];

  public function item(): BelongsTo
  {
    return $this->belongsTo(InventoryItem::class, 'inventory_item_id', 'item_id');
  }

  public function requestedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'requested_by', 'employee_id');
  }

  public function approvedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'approved_by', 'employee_id');
  }

  public function issuedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'issued_by', 'employee_id');
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
