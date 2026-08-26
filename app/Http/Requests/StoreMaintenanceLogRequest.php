<?php

namespace App\Http\Requests;

use App\Models\EquipmentMaintenanceLog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaintenanceLogRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }
  public function rules(): array
  {
    return [
      'type' => ['required', Rule::in(EquipmentMaintenanceLog::TYPES)],
      'description' => ['required', 'string'],
      'cost' => ['nullable', 'numeric', 'min:0'],
      'performed_by' => ['nullable', 'string', 'max:255'],
      'performed_at' => ['required', 'date'],
      'next_due_at' => ['nullable', 'date', 'after_or_equal:performed_at'],
      'in_progress' => ['sometimes', 'boolean'],
    ];
  }
}