<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentMissingReport extends Model
{
  public const STATUSES = ['Open', 'Found', 'Found Damaged'];

  protected $fillable = [
    'equipment_id',
    'last_employee_id',
    'last_work_order_id',
    'last_job_card_id',
    'last_known_location',
    'checkout_date',
    'last_scanned_at',
    'reported_by',
    'reported_at',
    'notes',
    'photos',
    'status',
    'resolved_at',
    'resolved_notes',
    'resolved_by',
  ];

  protected $casts = [
    'checkout_date' => 'datetime',
    'last_scanned_at' => 'datetime',
    'reported_at' => 'datetime',
    'resolved_at' => 'datetime',
    'photos' => 'array',
  ];

  public function equipment(): BelongsTo
  {
    return $this->belongsTo(Equipment::class);
  }

  public function lastEmployee(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'last_employee_id', 'employee_id');
  }

  public function reportedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'reported_by', 'employee_id');
  }

  public function resolvedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'resolved_by', 'employee_id');
  }

  public function lastWorkOrder(): BelongsTo
  {
    return $this->belongsTo(WorkOrder::class, 'last_work_order_id', 'work_order_id');
  }

  public function lastJobCard(): BelongsTo
  {
    return $this->belongsTo(JobCard::class, 'last_job_card_id', 'job_card_id');
  }
}
