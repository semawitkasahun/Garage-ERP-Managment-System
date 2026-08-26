<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentCheckoutResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'equipment_id' => $this->equipment_id,
      'employee' => $this->whenLoaded('employee', fn() => $this->employee ? [
        'id' => $this->employee->employee_id,
        'name' => trim($this->employee->first_name . ' ' . $this->employee->last_name),
      ] : null),
      'checked_out_by' => $this->whenLoaded('checkedOutBy', fn() => $this->employeeName($this->checkedOutBy)),
      'checked_out_at' => $this->checked_out_at,
      'due_at' => $this->due_at,
      'returned_at' => $this->returned_at,
      'returned_to' => $this->whenLoaded('returnedTo', fn() => $this->employeeName($this->returnedTo)),
      'condition_on_return' => $this->condition_on_return,
      'checkout_notes' => $this->checkout_notes,
      'return_notes' => $this->return_notes,
    ];
  }

  private function employeeName($employee): ?string
  {
    return $employee ? trim($employee->first_name . ' ' . $employee->last_name) : null;
  }
}