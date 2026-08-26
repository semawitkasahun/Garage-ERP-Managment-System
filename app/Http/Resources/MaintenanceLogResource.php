<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceLogResource extends JsonResource
{
  public function toArray(Request $request): array
  {
    return [
      'id' => $this->id,
      'equipment_id' => $this->equipment_id,
      'type' => $this->type,
      'description' => $this->description,
      'cost' => $this->cost,
      'performed_by' => $this->performed_by,
      'logged_by' => $this->whenLoaded('loggedBy', fn() => $this->loggedBy ? trim($this->loggedBy->first_name . ' ' . $this->loggedBy->last_name) : null),
      'performed_at' => $this->performed_at?->toDateString(),
      'next_due_at' => $this->next_due_at?->toDateString(),
    ];
  }
}