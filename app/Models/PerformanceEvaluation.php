<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceEvaluation extends Model
{
    use HasFactory;

    protected $table = 'performance_evaluations';
    protected $primaryKey = 'evaluation_id';

    protected $fillable = [
        'employee_id',
        'evaluator_id',
        'period',
        'rating',
        'comments',
    ];

    protected $casts = [
        'rating' => 'decimal:1',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id', 'user_id');
    }
}