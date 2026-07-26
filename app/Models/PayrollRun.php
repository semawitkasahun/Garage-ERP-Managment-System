<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollRun extends Model
{
    use HasFactory;

    protected $table = 'payroll_runs';
    protected $primaryKey = 'payroll_run_id';

    protected $fillable = [
        'branch_id',
        'period_start',
        'period_end',
        'status',
        'processed_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'processed_at' => 'datetime',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function items()
    {
        return $this->hasMany(PayrollItem::class, 'payroll_run_id');
    }
}