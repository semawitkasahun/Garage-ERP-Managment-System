<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentMaintenanceLog extends Model
{
  use HasFactory;

  public const TYPES = ['Routine', 'Repair', 'Inspection', 'Calibration', 'Other'];
  protected $fillable = ['equipment_id', 'logged_by', 'type', 'description', 'cost', 'performed_by', 'performed_at', 'next_due_at', 'photos'];
  protected $casts = ['cost' => 'decimal:2', 'performed_at' => 'date', 'next_due_at' => 'date', 'photos' => 'array'];
  public function equipment(): BelongsTo
  {
    return $this->belongsTo(Equipment::class);
  }
  public function loggedBy(): BelongsTo
  {
    return $this->belongsTo(Employee::class, 'logged_by', 'employee_id');
  }
}