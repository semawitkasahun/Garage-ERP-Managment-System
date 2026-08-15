<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $table = 'departments';
    protected $primaryKey = 'department_id';

    protected $fillable = [
        'name',
        'code',
        'description',
        'branch_id',
        'manager_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id', 'employee_id');
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class, 'department_id', 'department_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'department_id', 'department_id');
    }
}
