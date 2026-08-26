<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardPart;
use App\Models\JobCardLabor;
use App\Models\JobCardQcResult;
use App\Models\WorkOrderActivity;
use App\Models\NumberingSequence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCard::query()->with(['workOrder', 'assignedTechnician']);

        if ($request->has('work_order_id')) {
            $query->where('work_order_id', $request->work_order_id);
        }

        if ($request->has('assigned_technician_id')) {
            $query->where('assigned_technician_id', $request->assigned_technician_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        return $query->orderBy('step_number', 'asc')->orderBy('job_card_id', 'asc')
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'work_order_id' => 'required|integer|exists:work_orders,work_order_id',
            'job_title' => 'required|string|max:255',
            'step_number' => 'nullable|integer|min:1',
            'service_category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'customer_complaint_related' => 'nullable|string',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'assigned_technician_id' => 'nullable|integer|exists:users,user_id',
            'estimated_labor_hours' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
            'parts_cost' => 'nullable|numeric|min:0',
            'other_cost' => 'nullable|numeric|min:0',
        ]);

        $jobCard = DB::transaction(function () use ($validated, $request) {
            // Generate job card number
            $sequence = NumberingSequence::where('entity_type', 'job_cards')->first();
            $jobCardNumber = $sequence ? $sequence->getNextNumber() : 'JC-' . str_pad(JobCard::count() + 1, 5, '0', STR_PAD_LEFT);

            // Determine step number if not provided
            $stepNumber = $validated['step_number'] ?? null;
            if (!$stepNumber) {
                $maxStep = JobCard::where('work_order_id', $validated['work_order_id'])->max('step_number');
                $stepNumber = $maxStep ? $maxStep + 1 : 1;
            }

            // Calculate estimated total cost
            $estimatedTotalCost = ($validated['labor_cost'] ?? 0) + 
                                  ($validated['parts_cost'] ?? 0) + 
                                  ($validated['other_cost'] ?? 0);

            $jobCard = JobCard::create([
                'job_card_number' => $jobCardNumber,
                'work_order_id' => $validated['work_order_id'],
                'step_number' => $stepNumber,
                'job_title' => $validated['job_title'],
                'service_category' => $validated['service_category'] ?? null,
                'description' => $validated['description'] ?? null,
                'customer_complaint_related' => $validated['customer_complaint_related'] ?? null,
                'priority' => $validated['priority'] ?? 'normal',
                'assigned_technician_id' => $validated['assigned_technician_id'] ?? null,
                'estimated_labor_hours' => $validated['estimated_labor_hours'] ?? 0,
                'labor_cost' => $validated['labor_cost'] ?? 0,
                'parts_cost' => $validated['parts_cost'] ?? 0,
                'other_cost' => $validated['other_cost'] ?? 0,
                'estimated_total_cost' => $estimatedTotalCost,
                'status' => $validated['assigned_technician_id'] ? 'assigned' : 'draft',
                'created_date' => now(),
            ]);

            // Log activity
            WorkOrderActivity::create([
                'work_order_id' => $jobCard->work_order_id,
                'job_card_id' => $jobCard->job_card_id,
                'action' => 'job_card_created',
                'description' => "Job Card Step {$jobCard->step_number} created: {$jobCard->job_title}",
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
                'new_values' => $jobCard->toArray(),
            ]);

            return $jobCard;
        });

        return response()->json($jobCard->load(['workOrder', 'assignedTechnician']), 201);
    }

    public function show(JobCard $jobCard)
    {
        return $jobCard->load([
            'workOrder',
            'assignedTechnician',
            'parts.inventoryItem',
            'laborLogs.technician',
            'qcResults.inspector',
            'tasks',
            'partsRequisitions',
            'qualityControlChecks',
            'equipmentBookings'
        ]);
    }

    public function update(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'job_title' => 'nullable|string|max:255',
            'step_number' => 'nullable|integer|min:1',
            'service_category' => 'nullable|string|max:100',
            'description' => 'nullable|string',
            'customer_complaint_related' => 'nullable|string',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'assigned_technician_id' => 'nullable|integer|exists:users,user_id',
            'estimated_labor_hours' => 'nullable|numeric|min:0',
            'labor_cost' => 'nullable|numeric|min:0',
            'parts_cost' => 'nullable|numeric|min:0',
            'other_cost' => 'nullable|numeric|min:0',
            'technician_notes' => 'nullable|string',
        ]);

        $oldValues = $jobCard->toArray();
        
        // Recalculate estimated total cost if costs changed
        if (isset($validated['labor_cost']) || isset($validated['parts_cost']) || isset($validated['other_cost'])) {
            $validated['estimated_total_cost'] = ($validated['labor_cost'] ?? $jobCard->labor_cost) + 
                                               ($validated['parts_cost'] ?? $jobCard->parts_cost) + 
                                               ($validated['other_cost'] ?? $jobCard->other_cost);
        }

        // Update status based on technician assignment
        if (isset($validated['assigned_technician_id']) && $jobCard->status === 'draft') {
            $validated['status'] = 'assigned';
        }

        $jobCard->update($validated);

        // Log activity if technician changed
        if (isset($validated['assigned_technician_id']) && $validated['assigned_technician_id'] !== $oldValues['assigned_technician_id']) {
            WorkOrderActivity::create([
                'work_order_id' => $jobCard->work_order_id,
                'job_card_id' => $jobCard->job_card_id,
                'action' => 'technician_assigned',
                'description' => "Technician assigned to Job Card",
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
                'old_values' => ['assigned_technician_id' => $oldValues['assigned_technician_id']],
                'new_values' => ['assigned_technician_id' => $validated['assigned_technician_id']],
            ]);
        }

        return $jobCard;
    }

    public function destroy(JobCard $jobCard)
    {
        $workOrderId = $jobCard->work_order_id;
        $jobCardId = $jobCard->job_card_id;
        
        $jobCard->delete();

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $workOrderId,
            'job_card_id' => $jobCardId,
            'action' => 'job_card_deleted',
            'description' => 'Job Card deleted',
            'performed_by' => request()->user()->user_id,
            'performed_at' => now(),
        ]);

        return response()->noContent();
    }

    public function start(Request $request, JobCard $jobCard)
    {
        $jobCard->update([
            'status' => 'in_progress',
            'created_date' => $jobCard->created_date ?? now(),
            'last_resumed_at' => now(),
        ]);

        // If parent work order was draft/approved, move it to in_progress
        if (in_array($jobCard->workOrder->status, ['draft', 'open', 'approved'])) {
            $jobCard->workOrder->update(['status' => 'in_progress', 'started_at' => now()]);
        }

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $jobCard->work_order_id,
            'job_card_id' => $jobCard->job_card_id,
            'action' => 'job_card_started',
            'description' => "Job Card started: {$jobCard->job_title}",
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $jobCard->load(['assignedTechnician', 'parts.inventoryItem', 'laborLogs']);
    }

    public function pause(Request $request, JobCard $jobCard)
    {
        $jobCard->update([
            'status' => 'waiting_for_parts',
            'pause_count' => ($jobCard->pause_count ?? 0) + 1,
            'last_paused_at' => now(),
        ]);

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $jobCard->work_order_id,
            'job_card_id' => $jobCard->job_card_id,
            'action' => 'job_card_paused',
            'description' => "Job Card paused / waiting for parts: {$jobCard->job_title}",
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $jobCard->load(['assignedTechnician', 'parts.inventoryItem', 'laborLogs']);
    }

    public function resume(Request $request, JobCard $jobCard)
    {
        $jobCard->update([
            'status' => 'in_progress',
            'last_resumed_at' => now(),
        ]);

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $jobCard->work_order_id,
            'job_card_id' => $jobCard->job_card_id,
            'action' => 'job_card_resumed',
            'description' => "Job Card resumed: {$jobCard->job_title}",
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $jobCard->load(['assignedTechnician', 'parts.inventoryItem', 'laborLogs']);
    }

    public function complete(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'technician_notes' => 'nullable|string',
            'actual_labor_hours' => 'nullable|numeric|min:0',
            'work_performed' => 'nullable|string',
        ]);

        $actualHours = $validated['actual_labor_hours'] ?? ($jobCard->actual_labor_hours > 0 ? $jobCard->actual_labor_hours : $jobCard->estimated_labor_hours);
        $notes = $validated['technician_notes'] ?? $jobCard->technician_notes;
        if (!empty($validated['work_performed'])) {
            $notes = ($notes ? $notes . "\n" : "") . "Work Performed: " . $validated['work_performed'];
        }

        // Calculate actual total cost
        $actualLaborCost = $actualHours * ($jobCard->estimated_labor_hours > 0 ? ($jobCard->labor_cost / $jobCard->estimated_labor_hours) : $jobCard->labor_cost);
        $actualTotalCost = $actualLaborCost + $jobCard->parts_cost + $jobCard->other_cost;
        
        $jobCard->update([
            'status' => 'completed',
            'actual_labor_hours' => $actualHours,
            'actual_total_cost' => $actualTotalCost,
            'technician_notes' => $notes,
            'completed_date' => now(),
        ]);

        // Check if all job cards are completed for parent Work Order
        $allCompleted = $jobCard->workOrder->jobCards()->where('status', '!=', 'completed')->count() === 0;
        if ($allCompleted) {
            $jobCard->workOrder->update(['status' => 'qc_pending', 'qc_status' => 'pending']);
        }

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $jobCard->work_order_id,
            'job_card_id' => $jobCard->job_card_id,
            'action' => 'job_card_completed',
            'description' => "Job Card completed: {$jobCard->job_title}",
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $jobCard->load(['assignedTechnician', 'parts.inventoryItem', 'laborLogs', 'qcResults']);
    }

    public function assignTechnician(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'technician_id' => 'required|integer|exists:users,user_id',
        ]);

        $oldTechnicianId = $jobCard->assigned_technician_id;
        $jobCard->update([
            'assigned_technician_id' => $validated['technician_id'],
            'status' => 'assigned',
        ]);

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $jobCard->work_order_id,
            'job_card_id' => $jobCard->job_card_id,
            'action' => 'technician_assigned',
            'description' => 'Technician assigned to Job Card',
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
            'old_values' => ['assigned_technician_id' => $oldTechnicianId],
            'new_values' => ['assigned_technician_id' => $validated['technician_id']],
        ]);

        return $jobCard->load('assignedTechnician');
    }

    public function addPart(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'part_name' => 'nullable|string|max:255',
            'inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
            'requested_quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        if (empty($validated['part_name']) && empty($validated['inventory_item_id'])) {
            return response()->json(['message' => 'Please provide a part name or select an inventory item.'], 422);
        }

        $partName = $validated['part_name'] ?? null;
        if (!$partName && !empty($validated['inventory_item_id'])) {
            $invItem = \App\Models\InventoryItem::find($validated['inventory_item_id']);
            $partName = $invItem ? $invItem->name : 'Inventory Part';
        }

        $unitCost = $validated['unit_cost'] ?? 0;
        $totalCost = $unitCost * $validated['requested_quantity'];

        $part = JobCardPart::create([
            'job_card_id' => $jobCard->job_card_id,
            'inventory_item_id' => $validated['inventory_item_id'] ?? null,
            'part_name' => $partName,
            'requested_quantity' => $validated['requested_quantity'],
            'unit_cost' => $unitCost,
            'total_cost' => $totalCost,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update job card parts cost and estimated total
        $totalPartsCost = $jobCard->parts()->sum('total_cost');
        $jobCard->update([
            'parts_cost' => $totalPartsCost,
            'estimated_total_cost' => $jobCard->labor_cost + $totalPartsCost + $jobCard->other_cost,
        ]);

        return response()->json($part->load('inventoryItem'), 201);
    }

    public function deletePart(JobCard $jobCard, JobCardPart $part)
    {
        if ($part->job_card_id !== $jobCard->job_card_id) {
            return response()->json(['message' => 'Part does not belong to this Job Card'], 422);
        }

        $part->delete();

        // Update job card parts cost and total
        $totalPartsCost = $jobCard->parts()->sum('total_cost');
        $jobCard->update([
            'parts_cost' => $totalPartsCost,
            'estimated_total_cost' => $jobCard->labor_cost + $totalPartsCost + $jobCard->other_cost,
        ]);

        return response()->json([
            'message' => 'Part removed successfully',
            'parts_cost' => $totalPartsCost,
            'estimated_total_cost' => $jobCard->estimated_total_cost,
        ]);
    }

    public function updatePart(Request $request, JobCard $jobCard, JobCardPart $part)
    {
        if ($part->job_card_id !== $jobCard->job_card_id) {
            return response()->json(['message' => 'Part does not belong to this Job Card'], 422);
        }

        $validated = $request->validate([
            'part_name' => 'nullable|string|max:255',
            'issued_quantity' => 'nullable|numeric|min:0',
            'used_quantity' => 'nullable|numeric|min:0',
            'returned_quantity' => 'nullable|numeric|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $part->update($validated);

        // Recalculate total cost based on used/requested quantity
        $qty = $part->used_quantity > 0 ? $part->used_quantity : $part->requested_quantity;
        $part->update([
            'total_cost' => $part->unit_cost * $qty,
        ]);

        // Update job card parts cost
        $totalPartsCost = $jobCard->parts()->sum('total_cost');
        $jobCard->update([
            'parts_cost' => $totalPartsCost,
            'estimated_total_cost' => $jobCard->labor_cost + $totalPartsCost + $jobCard->other_cost,
            'actual_total_cost' => $jobCard->labor_cost + $totalPartsCost + $jobCard->other_cost,
        ]);

        return $part->load('inventoryItem');
    }

    public function addLabor(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'technician_id' => 'required|integer|exists:users,user_id',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date',
            'hourly_rate' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $startTime = \Carbon\Carbon::parse($validated['start_time']);
        $endTime = $validated['end_time'] ? \Carbon\Carbon::parse($validated['end_time']) : now();
        $hoursWorked = $startTime->diffInHours($endTime);
        $laborCost = $hoursWorked * ($validated['hourly_rate'] ?? 0);

        $labor = JobCardLabor::create([
            'job_card_id' => $jobCard->job_card_id,
            'technician_id' => $validated['technician_id'],
            'start_time' => $startTime,
            'end_time' => $endTime,
            'hours_worked' => $hoursWorked,
            'hourly_rate' => $validated['hourly_rate'] ?? 0,
            'labor_cost' => $laborCost,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update job card labor hours and cost
        $totalLaborHours = $jobCard->laborLogs()->sum('hours_worked');
        $totalLaborCost = $jobCard->laborLogs()->sum('labor_cost');
        $jobCard->update([
            'actual_labor_hours' => $totalLaborHours,
            'labor_cost' => $totalLaborCost,
            'actual_total_cost' => $totalLaborCost + $jobCard->parts_cost + $jobCard->other_cost,
        ]);

        return response()->json($labor->load('technician'), 201);
    }

    public function submitQc(Request $request, JobCard $jobCard)
    {
        $validated = $request->validate([
            'qc_status' => 'required|in:passed,needs_rework,failed',
            'qc_notes' => 'nullable|string',
        ]);

        $qcResult = JobCardQcResult::create([
            'job_card_id' => $jobCard->job_card_id,
            'inspector_id' => $request->user()->user_id,
            'qc_status' => $validated['qc_status'],
            'qc_notes' => $validated['qc_notes'] ?? null,
            'qc_performed_at' => now(),
        ]);

        // Update job card status based on QC result
        if ($validated['qc_status'] === 'needs_rework') {
            $jobCard->update(['status' => 'assigned']); // Return to assigned for rework
        }

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $jobCard->work_order_id,
            'job_card_id' => $jobCard->job_card_id,
            'action' => 'qc_performed',
            'description' => "Quality Control: {$validated['qc_status']}",
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
            'new_values' => ['qc_status' => $validated['qc_status']],
        ]);

        return response()->json($qcResult->load('inspector'), 201);
    }

    public function getByWorkOrder($workOrderId)
    {
        $jobCards = JobCard::where('work_order_id', $workOrderId)
            ->with(['assignedTechnician', 'parts', 'laborLogs', 'qcResults'])
            ->orderBy('step_number', 'asc')
            ->orderBy('job_card_id', 'asc')
            ->get();
        return $jobCards;
    }

    public function getByTechnician($technicianId)
    {
        $jobCards = JobCard::where('assigned_technician_id', $technicianId)
            ->with(['workOrder', 'workOrder.vehicle', 'workOrder.customer'])
            ->latest()
            ->get();
        return $jobCards;
    }

    public function getByStatus($status)
    {
        $jobCards = JobCard::where('status', $status)
            ->with(['workOrder', 'assignedTechnician'])
            ->latest()
            ->get();
        return $jobCards;
    }

    public function getByPriority($priority)
    {
        $jobCards = JobCard::where('priority', $priority)
            ->with(['workOrder', 'assignedTechnician'])
            ->latest()
            ->get();
        return $jobCards;
    }

    public function getProgress(JobCard $jobCard)
    {
        $totalTasks = $jobCard->tasks()->count();
        $completedTasks = $jobCard->tasks()->where('status', 'done')->count();

        $progress = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 2) : 0;

        return response()->json([
            'job_card_id' => $jobCard->job_card_id,
            'status' => $jobCard->status,
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'progress' => $progress . '%',
            'estimated_labor_hours' => $jobCard->estimated_labor_hours,
            'actual_labor_hours' => $jobCard->actual_labor_hours,
            'estimated_cost' => $jobCard->estimated_total_cost,
            'actual_cost' => $jobCard->actual_total_cost,
        ]);
    }
}