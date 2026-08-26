<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentTransfer extends Model
{
  protected $fillable = [
    'equipment_id',
    'from_employee_id',
    'to_employee_id',
    'work_order_id',
    'job_card_id',
    'reason',
    'approved_by',
    'previous_checkout_id',
    'new_checkout_id',
    'transferred_at',
  ];

  protected $casts = ['transferred_at' => 'datetime'];

  public function equipment(): BelongsTo
  {
    return $this->belongsTo(Equipment::class);
  }

  public function fromEmployee(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'from_employee_id', 'employee_id');
  }

  public function toEmployee(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'to_employee_id', 'employee_id');
  }

  public function approvedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'approved_by', 'employee_id');
  }

  public function workOrder(): BelongsTo
  {
    return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
  }

  public function jobCard(): BelongsTo
  {
    return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
  }

  public function previousCheckout(): BelongsTo
  {
    return $this->belongsTo(EquipmentCheckout::class, 'previous_checkout_id');
  }

  public function newCheckout(): BelongsTo
  {
    return $this->belongsTo(EquipmentCheckout::class, 'new_checkout_id');
  }
}
