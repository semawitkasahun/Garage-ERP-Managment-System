<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $table = 'payroll_periods';
    protected $primaryKey = 'payroll_period_id';

    protected $fillable = [
        'branch_id',
        'name',
        'start_date',
        'end_date',
        'status',
        'notes',
        'processed_at',
        'approved_at',
        'approved_by',
        'paid_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'processed_at' => 'datetime',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by', 'user_id');
    }

    public function payrollRuns()
    {
        // Payroll runs don't have payroll_period_id, they use period_start and period_end
        // This relationship won't work without the foreign key
        return $this->hasMany(PayrollRun::class, 'payroll_period_id', 'payroll_period_id');
    }

    public function payrollItems()
    {
        return $this->hasMany(PayrollItem::class, 'payroll_period_id', 'payroll_period_id');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', 'processing');
    }

    public function scopePendingApproval($query)
    {
        return $query->where('status', 'pending_approval');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['draft', 'processing', 'pending_approval']);
    }
}
