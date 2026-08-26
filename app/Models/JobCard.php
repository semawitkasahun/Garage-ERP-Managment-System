<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCard extends Model
{
    use HasFactory;

    protected $table = 'job_cards';
    protected $primaryKey = 'job_card_id';

    protected $fillable = [
        'job_card_number',
        'work_order_id',
        'step_number',
        'job_title',
        'service_category',
        'description',
        'customer_complaint_related',
        'status',
        'priority',
        'assigned_technician_id',
        'estimated_labor_hours',
        'actual_labor_hours',
        'labor_cost',
        'parts_cost',
        'other_cost',
        'estimated_total_cost',
        'actual_total_cost',
        'technician_notes',
        'created_date',
        'completed_date',
        'pause_count',
        'last_paused_at',
        'last_resumed_at',
        'estimated_completion_date',
        'is_supplement',
        'supplement_quotation_id',
    ];

    protected $casts = [
        'step_number' => 'integer',
        'estimated_labor_hours' => 'decimal:2',
        'actual_labor_hours' => 'decimal:2',
        'labor_cost' => 'decimal:2',
        'parts_cost' => 'decimal:2',
        'other_cost' => 'decimal:2',
        'estimated_total_cost' => 'decimal:2',
        'actual_total_cost' => 'decimal:2',
        'created_date' => 'datetime',
        'completed_date' => 'datetime',
        'last_paused_at' => 'datetime',
        'last_resumed_at' => 'datetime',
        'estimated_completion_date' => 'date',
        'is_supplement' => 'boolean',
        'pause_count' => 'integer',
    ];

    // Relationships
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }

    public function tasks()
    {
        return $this->hasMany(JobCardTask::class, 'job_card_id');
    }

    public function partsRequisitions()
    {
        return $this->hasMany(PartsRequisition::class, 'job_card_id');
    }

    public function qualityControlChecks()
    {
        return $this->hasMany(QualityControlCheck::class, 'job_card_id');
    }

    public function equipmentBookings()
    {
        return $this->hasMany(EquipmentBooking::class, 'job_card_id');
    }

    public function partRequests()
    {
        return $this->hasMany(JobCardPartRequest::class, 'job_card_id', 'job_card_id');
    }

    public function assignedTechnician()
    {
        return $this->belongsTo(User::class, 'assigned_technician_id', 'user_id');
    }

    public function parts()
    {
        return $this->hasMany(JobCardPart::class, 'job_card_id');
    }

    public function laborLogs()
    {
        return $this->hasMany(JobCardLabor::class, 'job_card_id');
    }

    public function qcResults()
    {
        return $this->hasMany(JobCardQcResult::class, 'job_card_id');
    }

    public function supplementQuotation()
    {
        return $this->belongsTo(Quotation::class, 'supplement_quotation_id', 'quotation_id');
    }

    public function attachments()
    {
        return $this->hasMany(WorkOrderAttachment::class, 'job_card_id')->where('work_order_id', $this->work_order_id);
    }

    // Helper methods for the workflow
    public function calculateEstimatedCost()
    {
        return $this->labor_cost + $this->parts_cost + $this->other_cost;
    }

    public function calculateActualCost()
    {
        return $this->actual_labor_hours * ($this->labor_cost / max($this->estimated_labor_hours, 1)) +
            $this->parts_cost + $this->other_cost;
    }

    public function getLatestQcResult()
    {
        return $this->qcResults()->latest()->first();
    }

    public function canComplete()
    {
        // Job card can be completed when:
        // - Status is in_progress
        // - All required parts are issued/used
        // - Labor time is recorded

        if ($this->status !== 'in_progress') {
            return false;
        }

        // Check if labor time is recorded
        if ($this->actual_labor_hours <= 0) {
            return false;
        }

        return true;
    }

    public function pause()
    {
        if ($this->status !== 'in_progress') {
            return false;
        }

        $this->status = 'on_hold';
        $this->pause_count = ($this->pause_count ?? 0) + 1;
        $this->last_paused_at = now();
        $this->save();

        return true;
    }

    public function resume()
    {
        if ($this->status !== 'on_hold') {
            return false;
        }

        $this->status = 'in_progress';
        $this->last_resumed_at = now();
        $this->save();

        return true;
    }

    public function start()
    {
        if ($this->status !== 'assigned') {
            return false;
        }

        $this->status = 'in_progress';
        $this->created_date = now();
        $this->save();

        return true;
    }

    public function complete()
    {
        if (!$this->canComplete()) {
            return false;
        }

        $this->status = 'completed';
        $this->completed_date = now();
        $this->actual_total_cost = $this->calculateActualCost();
        $this->save();

        return true;
    }

    public function needsRework()
    {
        if ($this->status !== 'completed') {
            return false;
        }

        $this->status = 'assigned';
        $this->save();

        return true;
    }

    public function isSupplement()
    {
        return $this->is_supplement === true;
    }

    public function getTotalPartsCost()
    {
        return $this->parts()->sum('total_cost');
    }

    public function getTotalLaborCost()
    {
        return $this->laborLogs()->sum('labor_cost');
    }
}