<?php

namespace App\Http\Requests;

use App\Models\Equipment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquipmentRequest extends FormRequest
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
        if (!$this->has('current_location') && $this->has('storage_location')) {
            $this->merge(['current_location' => $this->input('storage_location')]);
        }
        if ($this->has('condition') && ($this->input('condition') === 'N/A' || $this->input('condition') === '')) {
            $this->merge(['condition' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'current_location' => ['required', 'string', 'max:255'],
            'storage_location' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'condition' => ['nullable', 'string', 'max:50'],
            'brand' => ['nullable', 'string', 'max:100'],
            'model' => ['nullable', 'string', 'max:100'],
            'serial_number' => ['nullable', 'string', 'max:100', 'unique:equipment,serial_number'],
            'description' => ['nullable', 'string'],
            'assigned_employee_id' => ['nullable', 'exists:employees,employee_id'],
            'purchase_date' => ['nullable', 'date'],
            'purchase_cost' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}