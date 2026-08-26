<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('storage_location') && !$this->has('current_location')) {
            $this->merge(['current_location' => $this->input('storage_location')]);
        }
        if ($this->has('condition') && ($this->input('condition') === 'N/A' || $this->input('condition') === '')) {
            $this->merge(['condition' => null]);
        }
    }

    public function rules(): array
    {
        $equipmentId = $this->route('equipment') instanceof \App\Models\Equipment
            ? $this->route('equipment')->id
            : $this->route('equipment');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'max:100'],
            'current_location' => ['sometimes', 'required', 'string', 'max:255'],
            'storage_location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'condition' => ['nullable', 'string', 'max:50'],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100', Rule::unique('equipment', 'serial_number')->ignore($equipmentId)],
            'description' => ['nullable', 'string'],
            'assigned_employee_id' => ['nullable', 'exists:employees,employee_id'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}