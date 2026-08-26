<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentCheckout extends Model
{
  use HasFactory;

  protected $fillable = ['equipment_id', 'employee_id', 'checked_out_by', 'returned_to', 'work_order_id', 'job_card_id', 'equipment_request_id', 'checked_out_at', 'due_at', 'returned_at', 'condition_on_return', 'checkout_notes', 'return_notes', 'closed_reason', 'return_photos'];
  protected $casts = ['checked_out_at' => 'datetime', 'due_at' => 'datetime', 'returned_at' => 'datetime', 'return_photos' => 'array'];
  public function equipment(): BelongsTo
  {
    return $this->belongsTo(Equipment::class);
  }
  public function employee(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
  }
  public function checkedOutBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'checked_out_by', 'employee_id');
  }
  public function returnedTo(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'returned_to', 'employee_id');
  }

  public function workOrder(): BelongsTo
  {
    return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
  }

  public function jobCard(): BelongsTo
  {
    return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
  }

  public function equipmentRequest(): BelongsTo
  {
    return $this->belongsTo(EquipmentRequest::class, 'equipment_request_id');
  }
}