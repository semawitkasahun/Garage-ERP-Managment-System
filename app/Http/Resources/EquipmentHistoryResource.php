<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'equipment_id' => $this->equipment_id,
            'event_type' => $this->event_type,
            'title' => $this->title,
            'description' => $this->description,
            'performed_by' => $this->performed_by,
            'metadata' => $this->metadata,
            'event_date' => $this->event_date?->toIso8601String(),
            'formatted_date' => $this->event_date?->format('d M Y, h:i A'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
