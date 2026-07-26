<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TechnicianSkill extends Model
{
    use HasFactory;

    protected $table = 'technician_skills';
    protected $primaryKey = 'skill_id';

    protected $fillable = [
        'employee_id',
        'skill_name',
        'certification_name',
        'certified_at',
        'expiry_date',
    ];

    protected $casts = [
        'certified_at' => 'date',
        'expiry_date' => 'date',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }
}