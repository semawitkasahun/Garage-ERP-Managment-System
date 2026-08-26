<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckOutEquipmentRequest extends FormRequest
{
  public function authorize(): bool
  {
    return true;
  }
  public function rules(): array
  {
    return [
      'employee_id' => ['required', 'exists:employees,employee_id'],
      'work_order_id' => ['nullable', 'integer'],
      'job_card_id' => ['nullable', 'integer'],
      'due_at' => ['required', 'date', 'after_or_equal:today'],
      'checkout_notes' => ['nullable', 'string'],
    ];
  }
}