<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EquipmentRequest extends Model
{
  public const STATUSES = ['Pending', 'Approved', 'Rejected', 'Issued', 'Cancelled'];

  protected $fillable = [
    'equipment_id',
    'requested_by',
    'work_order_id',
    'job_card_id',
    'reason',
    'status',
    'reviewed_by',
    'reviewed_at',
    'review_notes',
  ];

  protected $casts = ['reviewed_at' => 'datetime'];

  public function equipment(): BelongsTo
  {
    return $this->belongsTo(Equipment::class);
  }

  public function requestedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'requested_by', 'employee_id');
  }

  public function reviewedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'reviewed_by', 'employee_id');
  }

  public function checkout(): HasOne
  {
    return $this->hasOne(EquipmentCheckout::class, 'equipment_request_id');
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
