<?php

namespace App\Http\Requests;

use App\Models\Equipment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckInEquipmentRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }
  public function rules(): array
  {
    return [
      'condition_on_return' => ['required', Rule::in(['Good', 'Damaged', 'Missing Parts', 'Needs Maintenance'])],
      'return_notes' => ['nullable', 'string'],
      'photos' => ['nullable', 'array'],
      'photos.*' => ['string'],
    ];
  }
}