<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EquipmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'equipment_code' => $this->equipment_code,
            'name' => $this->name,
            'category' => $this->category,
            'brand' => $this->brand,
            'model' => $this->model,
            'serial_number' => $this->serial_number,
            'description' => $this->description,
            'storage_location' => $this->current_location,
            'current_location' => $this->current_location,
            'condition' => $this->condition ?? 'N/A',
            'status' => $this->status,
            'is_available' => $this->status === 'Available',
            'qr_ready' => !empty($this->qr_code) && !empty($this->checkout_qr_code),
            'qr_code' => $this->qr_code,
            'qr_image_url' => route('equipment.qr', $this->id) . '?type=tracking',
            'checkout_qr_code' => $this->checkout_qr_code,
            'checkout_qr_image_url' => route('equipment.qr', $this->id) . '?type=checkout',
            'is_overdue' => $this->is_overdue,
            'assigned_employee' => $this->whenLoaded('assignedEmployee', fn() => $this->assignedEmployee ? [
                'id' => $this->assignedEmployee->employee_id,
                'name' => trim($this->assignedEmployee->first_name . ' ' . $this->assignedEmployee->last_name),
            ] : null),
            'purchase_date' => $this->purchase_date?->toDateString(),
            'purchase_cost' => $this->purchase_cost ? (float) $this->purchase_cost : null,
            'last_maintenance_date' => $this->last_maintenance_date?->toDateString(),
            'next_maintenance_due' => $this->next_maintenance_due?->toDateString(),
            'notes' => $this->notes,
            'active_checkout' => EquipmentCheckoutResource::make($this->whenLoaded('checkouts', fn() => $this->checkouts->firstWhere('returned_at', null))),
            'histories' => EquipmentHistoryResource::collection($this->whenLoaded('histories')),
            'maintenance_logs' => MaintenanceLogResource::collection($this->whenLoaded('maintenanceLogs')),
            'created_at' => $this->created_at?->toIso8601String(),
            'registered_date' => $this->created_at?->format('M d, Y'),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}