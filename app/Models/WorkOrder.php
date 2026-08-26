<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOrder extends Model
{
    use HasFactory;

    protected $table = 'work_orders';
    protected $primaryKey = 'work_order_id';

    protected $fillable = [
        'work_order_number',
        'quotation_id',
        'checkin_id',
        'appointment_id',
        'vehicle_id',
        'customer_id',
        'branch_id',
        'section_id',
        'supervisor_id',
        'service_advisor_id',
        'status',
        'priority',
        'mileage_in',
        'mileage_out',
        'is_manual',
        'started_at',
        'started_by',
        'completed_at',
        'invoice_id',
        'qc_status',
        'qc_performed_at',
        'qc_performed_by',
        'estimated_completion_date',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'qc_performed_at' => 'datetime',
        'estimated_completion_date' => 'date',
        'is_manual' => 'boolean',
    ];

    protected $appends = [
        'job_cards_count',
        'estimated_total_cost',
        'actual_total_cost',
        'labor_total_cost',
        'parts_total_cost',
        'other_total_cost',
        'assigned_technicians',
    ];

    public function getJobCardsCountAttribute()
    {
        return $this->relationLoaded('jobCards') ? $this->jobCards->count() : $this->jobCards()->count();
    }

    public function getEstimatedTotalCostAttribute()
    {
        if ($this->relationLoaded('jobCards')) {
            return (float) $this->jobCards->sum('estimated_total_cost');
        }
        return (float) $this->jobCards()->sum('estimated_total_cost');
    }

    public function getActualTotalCostAttribute()
    {
        if ($this->relationLoaded('jobCards')) {
            return (float) $this->jobCards->sum('actual_total_cost');
        }
        return (float) $this->jobCards()->sum('actual_total_cost');
    }

    public function getLaborTotalCostAttribute()
    {
        if ($this->relationLoaded('jobCards')) {
            return (float) $this->jobCards->sum('labor_cost');
        }
        return (float) $this->jobCards()->sum('labor_cost');
    }

    public function getPartsTotalCostAttribute()
    {
        if ($this->relationLoaded('jobCards')) {
            return (float) $this->jobCards->sum('parts_cost');
        }
        return (float) $this->jobCards()->sum('parts_cost');
    }

    public function getOtherTotalCostAttribute()
    {
        if ($this->relationLoaded('jobCards')) {
            return (float) $this->jobCards->sum('other_cost');
        }
        return (float) $this->jobCards()->sum('other_cost');
    }

    public function getAssignedTechniciansAttribute()
    {
        $techs = collect();
        if ($this->relationLoaded('jobCards')) {
            foreach ($this->jobCards as $jc) {
                if ($jc->assignedTechnician) {
                    $techs->push($jc->assignedTechnician);
                }
            }
        }
        return $techs->unique('user_id')->values();
    }

    // Relationships
    public function quotation()
    {
        return $this->belongsTo(Quotation::class, 'quotation_id', 'quotation_id');
    }

    public function checkin()
    {
        return $this->belongsTo(VehicleCheckin::class, 'checkin_id', 'checkin_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class, 'vehicle_id', 'vehicle_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function section()
    {
        return $this->belongsTo(Section::class, 'section_id', 'section_id');
    }

    public function supervisor()
    {
        return $this->belongsTo(User::class, 'supervisor_id', 'user_id');
    }

    public function serviceAdvisor()
    {
        return $this->belongsTo(User::class, 'service_advisor_id', 'user_id');
    }

    public function startedBy()
    {
        return $this->belongsTo(User::class, 'started_by', 'user_id');
    }

    public function jobCards()
    {
        return $this->hasMany(JobCard::class, 'work_order_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class, 'appointment_id', 'appointment_id');
    }

    public function delivery()
    {
        return $this->hasOne(VehicleDelivery::class, 'work_order_id');
    }

    public function activities()
    {
        return $this->hasMany(WorkOrderActivity::class, 'work_order_id');
    }

    public function supplements()
    {
        return $this->hasMany(WorkOrderSupplement::class, 'work_order_id');
    }

    public function attachments()
    {
        return $this->hasMany(WorkOrderAttachment::class, 'work_order_id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id', 'invoice_id');
    }

    public function qcPerformedBy()
    {
        return $this->belongsTo(User::class, 'qc_performed_by', 'user_id');
    }

    // Helper methods for the workflow
    public function canStartWork()
    {
        // Business rule: Work can start when:
        // - Check-in is completed
        // - Work order exists
        // - Quotation is approved (if required)
        // - At least one job card exists
        
        if (!$this->checkin || $this->checkin->checkin_status !== 'completed') {
            return false;
        }

        if ($this->quotation && $this->quotation->customer_approval_status !== 'approved') {
            return false;
        }

        return $this->jobCards()->exists();
    }

    public function startWork($userId)
    {
        if (!$this->canStartWork()) {
            return false;
        }

        $this->status = 'in_progress';
        $this->started_at = now();
        $this->started_by = $userId;
        $this->save();

        // Log activity
        $this->activities()->create([
            'action' => 'work_started',
            'description' => 'Work started on work order',
            'performed_by' => $userId,
        ]);

        return true;
    }

    public function complete($userId)
    {
        if (!$this->areAllJobCardsCompleted()) {
            return false;
        }

        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();

        // Log activity
        $this->activities()->create([
            'action' => 'work_order_completed',
            'description' => 'Work order completed',
            'performed_by' => $userId,
        ]);

        return true;
    }

    public function submitForQc($userId)
    {
        if (!$this->areAllJobCardsCompleted()) {
            return false;
        }

        $this->status = 'qc_pending';
        $this->qc_status = 'pending';
        $this->save();

        // Log activity
        $this->activities()->create([
            'action' => 'submitted_for_qc',
            'description' => 'Work order submitted for quality control',
            'performed_by' => $userId,
        ]);

        return true;
    }

    public function passQc($userId, $notes = null)
    {
        if ($this->status !== 'qc_pending') {
            return false;
        }

        $this->status = 'qc_passed';
        $this->qc_status = 'passed';
        $this->qc_performed_at = now();
        $this->qc_performed_by = $userId;
        $this->save();

        // Log activity
        $this->activities()->create([
            'action' => 'qc_passed',
            'description' => 'Quality control passed' . ($notes ? ': ' . $notes : ''),
            'performed_by' => $userId,
        ]);

        return true;
    }

    public function failQc($userId, $reason)
    {
        if ($this->status !== 'qc_pending') {
            return false;
        }

        $this->status = 'qc_failed';
        $this->qc_status = 'failed';
        $this->qc_performed_at = now();
        $this->qc_performed_by = $userId;
        $this->save();

        // Mark job cards for rework
        foreach ($this->jobCards as $jobCard) {
            $jobCard->needsRework();
        }

        // Log activity
        $this->activities()->create([
            'action' => 'qc_failed',
            'description' => 'Quality control failed: ' . $reason,
            'performed_by' => $userId,
        ]);

        return true;
    }

    public function createInvoice($userId)
    {
        if ($this->status !== 'qc_passed') {
            return false;
        }

        // Create invoice logic here
        // This would connect to your existing billing system

        $this->status = 'invoiced';
        $this->save();

        // Log activity
        $this->activities()->create([
            'action' => 'invoice_created',
            'description' => 'Invoice created for work order',
            'performed_by' => $userId,
        ]);

        return true;
    }

    public function calculateTotalEstimatedCost()
    {
        return $this->jobCards()->sum('estimated_total_cost');
    }

    public function calculateTotalActualCost()
    {
        return $this->jobCards()->sum('actual_total_cost');
    }

    public function recalculateTotals()
    {
        return [
            'estimated' => $this->calculateTotalEstimatedCost(),
            'actual' => $this->calculateTotalActualCost(),
        ];
    }

    public function areAllJobCardsCompleted()
    {
        return $this->jobCards()->where('status', '!=', 'completed')->count() === 0;
    }

    public function hasAllQcPassed()
    {
        foreach ($this->jobCards as $jobCard) {
            $latestQc = $jobCard->qcResults()->latest()->first();
            if (!$latestQc || $latestQc->qc_status !== 'passed') {
                return false;
            }
        }
        return true;
    }

    public function getWorkflowStatus()
    {
        // Returns the current stage in the workflow
        if ($this->status === 'draft') {
            return 'draft';
        }
        if ($this->status === 'awaiting_quotation') {
            return 'awaiting_quotation';
        }
        if ($this->status === 'awaiting_approval') {
            return 'awaiting_approval';
        }
        if ($this->status === 'approved') {
            return 'ready_to_start';
        }
        if ($this->status === 'in_progress') {
            return 'in_progress';
        }
        if ($this->status === 'qc_pending') {
            return 'qc_pending';
        }
        if ($this->status === 'qc_passed') {
            return 'ready_to_invoice';
        }
        if ($this->status === 'invoiced') {
            return 'invoiced';
        }
        if ($this->status === 'closed') {
            return 'closed';
        }
        
        return 'unknown';
    }

    public function getTimelineSteps()
    {
        // Returns the workflow timeline for display
        $steps = [
            'checkin' => [
                'label' => 'Check-In',
                'completed' => $this->checkin && $this->checkin->checkin_status === 'completed',
                'date' => $this->checkin?->checked_in_at,
            ],
            'inspection' => [
                'label' => 'Inspection',
                'completed' => $this->checkin && $this->checkin->inspection_status === 'completed',
                'date' => $this->checkin?->inspection_completed_at,
            ],
            'quotation' => [
                'label' => 'Quotation',
                'completed' => $this->quotation && $this->quotation->customer_approval_status === 'approved',
                'date' => $this->quotation?->customer_approved_at,
            ],
            'work' => [
                'label' => 'Work',
                'completed' => $this->status === 'completed' || $this->status === 'qc_passed' || $this->status === 'invoiced' || $this->status === 'closed',
                'date' => $this->completed_at,
            ],
            'qc' => [
                'label' => 'Quality Control',
                'completed' => $this->qc_status === 'passed',
                'date' => $this->qc_performed_at,
            ],
            'invoice' => [
                'label' => 'Invoice',
                'completed' => $this->status === 'invoiced' || $this->status === 'closed',
                'date' => $this->invoice?->created_at,
            ],
            'payment' => [
                'label' => 'Payment',
                'completed' => $this->status === 'closed',
                'date' => $this->invoice?->paid_at,
            ],
        ];

        return $steps;
    }

    public function isManual()
    {
        return $this->is_manual === true;
    }

    public function addSupplement($data, $userId)
    {
        $supplement = $this->supplements()->create([
            'supplement_number' => 'SUP-' . str_pad($this->supplements()->count() + 1, 4, '0', STR_PAD_LEFT),
            'reason' => $data['reason'],
            'description' => $data['description'] ?? null,
            'additional_cost' => $data['additional_cost'] ?? 0,
            'status' => 'draft',
            'created_by' => $userId,
        ]);

        // Log activity
        $this->activities()->create([
            'action' => 'supplement_added',
            'description' => 'Additional work supplement added: ' . $data['reason'],
            'performed_by' => $userId,
        ]);

        return $supplement;
    }
}