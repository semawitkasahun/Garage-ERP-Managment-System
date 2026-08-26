<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use App\Models\WorkOrderActivity;
use App\Models\VehicleCheckin;
use App\Models\NumberingSequence;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = WorkOrder::query()->with([
            'customer',
            'vehicle',
            'branch',
            'quotation',
            'supervisor',
            'serviceAdvisor',
            'jobCards.assignedTechnician',
            'jobCards.parts.inventoryItem',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('work_order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  })
                  ->orWhereHas('vehicle', function ($vq) use ($search) {
                      $vq->where('plate_number', 'like', "%{$search}%")
                         ->orWhere('make', 'like', "%{$search}%")
                         ->orWhere('model', 'like', "%{$search}%")
                         ->orWhere('vin', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('priority') && $request->priority !== 'all') {
            $query->where('priority', $request->priority);
        }

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'checkin_id' => 'nullable|integer|exists:vehicle_checkins,checkin_id',
            'quotation_id' => 'nullable|integer|exists:quotations,quotation_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
            'supervisor_id' => 'nullable|integer|exists:users,user_id',
            'service_advisor_id' => 'nullable|integer|exists:users,user_id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'status' => 'nullable|in:draft,open,awaiting_quotation,awaiting_approval,approved,in_progress,completed,closed,cancelled',
            'is_manual' => 'nullable|boolean',
        ]);

        $workOrder = DB::transaction(function () use ($validated, $request) {
            // Generate work order number
            $sequence = NumberingSequence::where('entity_type', 'work_orders')->first();
            
            // Create sequence if it doesn't exist
            if (!$sequence) {
                $sequence = NumberingSequence::create([
                    'entity_type' => 'work_orders',
                    'prefix' => 'WO',
                    'next_number' => 1,
                ]);
            }
            
            $workOrderNumber = $sequence->getNextNumber();
            $branchId = $validated['branch_id'] ?? $request->user()->branch_id ?? 1;

            $workOrder = WorkOrder::create([
                'work_order_number' => $workOrderNumber,
                'checkin_id' => $validated['checkin_id'] ?? null,
                'quotation_id' => $validated['quotation_id'] ?? null,
                'vehicle_id' => $validated['vehicle_id'],
                'customer_id' => $validated['customer_id'],
                'branch_id' => $branchId,
                'supervisor_id' => $validated['supervisor_id'] ?? $request->user()->user_id,
                'service_advisor_id' => $validated['service_advisor_id'] ?? null,
                'priority' => $validated['priority'] ?? 'normal',
                'status' => $validated['status'] ?? 'draft',
                'is_manual' => $validated['is_manual'] ?? (!isset($validated['checkin_id'])),
            ]);

            // Update checkin with work order reference if checkin provided
            if (!empty($validated['checkin_id'])) {
                VehicleCheckin::where('checkin_id', $validated['checkin_id'])
                    ->update(['work_order_id' => $workOrder->work_order_id]);
            }

            // Log activity
            WorkOrderActivity::create([
                'work_order_id' => $workOrder->work_order_id,
                'action' => 'work_order_created',
                'description' => !empty($validated['checkin_id']) 
                    ? "Work Order created from Check-In #{$validated['checkin_id']}"
                    : "Manual Work Order created",
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
                'new_values' => $workOrder->toArray(),
            ]);

            // Auto-generate initial Job Card(s) for the services
            $this->autoGenerateJobCards($workOrder, $validated, $request);

            return $workOrder;
        });

        return response()->json($workOrder->load([
            'checkin.customer',
            'checkin.vehicle',
            'vehicle',
            'customer',
            'supervisor',
            'jobCards.assignedTechnician'
        ]), 201);
    }

    public function show(WorkOrder $workOrder)
    {
        return $workOrder->load([
            'checkin.checkinInspection.inspector',
            'checkin.checkinInspection.itemResults.inspectionItem.category',
            'checkin.checkedInBy',
            'checkin.damageRecords',
            'quotation.items.inventoryItem',
            'vehicle',
            'customer',
            'branch',
            'supervisor',
            'serviceAdvisor',
            'startedBy',
            'jobCards.assignedTechnician',
            'jobCards.parts.inventoryItem',
            'jobCards.laborLogs.technician',
            'jobCards.qcResults.inspector',
            'activities.performedBy',
            'delivery',
        ]);
    }

    public function update(Request $request, WorkOrder $workOrder)
    {
        $validated = $request->validate([
            'supervisor_id' => 'nullable|integer|exists:users,user_id',
            'service_advisor_id' => 'nullable|integer|exists:users,user_id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'status' => 'nullable|in:draft,open,awaiting_quotation,awaiting_approval,approved,in_progress,completed,closed,cancelled',
        ]);

        $oldValues = $workOrder->toArray();
        $workOrder->update($validated);

        // Log activity if status changed
        if (isset($validated['status']) && $validated['status'] !== $oldValues['status']) {
            WorkOrderActivity::create([
                'work_order_id' => $workOrder->work_order_id,
                'action' => 'status_changed',
                'description' => "Status changed from {$oldValues['status']} to {$validated['status']}",
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
                'old_values' => ['status' => $oldValues['status']],
                'new_values' => ['status' => $validated['status']],
            ]);
        }

        return $workOrder;
    }

    public function destroy(WorkOrder $workOrder)
    {
        $workOrder->delete();
        return response()->noContent();
    }

    public function start(Request $request, WorkOrder $workOrder)
    {
        // Check if work can be started
        if (!$workOrder->canStartWork()) {
            return response()->json([
                'message' => 'Cannot start work. Check prerequisites: Check-In completed, Quotation approved, Job Cards created.'
            ], 422);
        }

        $workOrder->update([
            'status' => 'in_progress',
            'started_at' => now(),
            'started_by' => $request->user()->user_id,
        ]);

        // Update all job cards to in_progress
        $workOrder->jobCards()->update(['status' => 'in_progress']);

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $workOrder->work_order_id,
            'action' => 'work_started',
            'description' => 'Work started on Work Order',
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $workOrder->load(['jobCards']);
    }

    public function complete(Request $request, WorkOrder $workOrder)
    {
        // Check if all job cards are completed and QC passed
        if (!$workOrder->areAllJobCardsCompleted()) {
            return response()->json([
                'message' => 'Cannot complete Work Order. Not all Job Cards are completed.'
            ], 422);
        }

        if (!$workOrder->hasAllQcPassed()) {
            return response()->json([
                'message' => 'Cannot complete Work Order. Not all Quality Control checks have passed.'
            ], 422);
        }

        $workOrder->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $workOrder->work_order_id,
            'action' => 'work_order_completed',
            'description' => 'Work Order completed',
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $workOrder;
    }

    public function close(Request $request, WorkOrder $workOrder)
    {
        if ($workOrder->status !== 'completed') {
            return response()->json([
                'message' => 'Can only close completed Work Orders.'
            ], 422);
        }

        $workOrder->update(['status' => 'closed']);

        // Log activity
        WorkOrderActivity::create([
            'work_order_id' => $workOrder->work_order_id,
            'action' => 'work_order_closed',
            'description' => 'Work Order closed',
            'performed_by' => $request->user()->user_id,
            'performed_at' => now(),
        ]);

        return $workOrder;
    }

    public function getByCustomer($customerId)
    {
        $workOrders = WorkOrder::where('customer_id', $customerId)
            ->with(['vehicle', 'branch', 'supervisor'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getByVehicle($vehicleId)
    {
        $workOrders = WorkOrder::where('vehicle_id', $vehicleId)
            ->with(['customer', 'branch', 'supervisor'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getByCheckin($checkinId)
    {
        $workOrder = WorkOrder::where('checkin_id', $checkinId)
            ->with(['customer', 'vehicle', 'branch', 'supervisor', 'jobCards'])
            ->first();
        return $workOrder;
    }

    public function getPending()
    {
        $workOrders = WorkOrder::whereIn('status', ['draft', 'open', 'awaiting_quotation', 'awaiting_approval', 'approved'])
            ->with(['customer', 'vehicle', 'supervisor'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getInProgress()
    {
        $workOrders = WorkOrder::where('status', 'in_progress')
            ->with(['customer', 'vehicle', 'supervisor'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getCompleted()
    {
        $workOrders = WorkOrder::where('status', 'completed')
            ->with(['customer', 'vehicle', 'supervisor'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getByBranch($branchId)
    {
        $workOrders = WorkOrder::where('branch_id', $branchId)
            ->with(['customer', 'vehicle', 'supervisor'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getSummary()
    {
        $summary = [
            'total' => WorkOrder::count(),
            'by_status' => WorkOrder::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'total_in_progress' => WorkOrder::where('status', 'in_progress')->count(),
            'total_completed_today' => WorkOrder::whereDate('completed_at', today())->count(),
            'average_completion_time' => $this->getAverageCompletionTime(),
        ];
        return $summary;
    }

    private function getAverageCompletionTime()
    {
        $completed = WorkOrder::whereNotNull('completed_at')
            ->whereNotNull('created_at')
            ->get();

        if ($completed->isEmpty()) {
            return null;
        }

        $totalHours = 0;
        foreach ($completed as $workOrder) {
            $totalHours += $workOrder->created_at->diffInHours($workOrder->completed_at);
        }

        return round($totalHours / $completed->count(), 2) . ' hours';
    }

    public function getActivities(WorkOrder $workOrder)
    {
        return $workOrder->activities()
            ->with(['performedBy', 'jobCard'])
            ->latest()
            ->get();
    }

    /**
    /**
     * Automatically generate Job Card(s) for all services based on the step it will be done.
     */
    public function autoGenerateJobCards(WorkOrder $workOrder, array $validated = [], Request $request = null)
    {
        $servicesToCreate = [];

        // 1. Check if Work Order has an associated Quotation with service/labor items
        if ($workOrder->quotation_id) {
            $quotation = \App\Models\Quotation::with('items')->find($workOrder->quotation_id);
            if ($quotation && $quotation->items->count() > 0) {
                foreach ($quotation->items as $item) {
                    if ($item->item_type === 'labor' || $item->item_type === 'service') {
                        $servicesToCreate[] = [
                            'title' => $item->description ?: 'Scheduled Service Item',
                            'category' => 'General Service',
                            'description' => "Quotation Service Step: {$item->description}",
                            'complaint' => null,
                            'estimated_hours' => $item->quantity ?: 1.0,
                            'labor_cost' => $item->line_total ?: 0.00,
                            'technician_id' => null,
                        ];
                    }
                }
            }
        }

        // 2. Check if check-in exists
        if ($workOrder->checkin_id) {
            $checkin = VehicleCheckin::with([
                'appointment',
                'checkinInspection.itemResults.inspectionItem',
                'checklistItems'
            ])->find($workOrder->checkin_id);

            if ($checkin) {
                // A. Scheduled Appointment Service (Split multiple services into individual Job Cards)
                if ($checkin->appointment && !empty($checkin->appointment->service_type)) {
                    $rawServiceType = $checkin->appointment->service_type;
                    $splitServices = preg_split('/[,;\/\|]|\s+and\s+|\s+&\s+/i', $rawServiceType);
                    
                    foreach ($splitServices as $singleService) {
                        $singleService = trim($singleService);
                        if (!empty($singleService)) {
                            $category = (stripos($singleService, 'diag') !== false) ? 'Diagnostics' : 'Scheduled Maintenance';
                            $servicesToCreate[] = [
                                'title' => $singleService,
                                'category' => $category,
                                'description' => "Scheduled service step: {$singleService}",
                                'complaint' => $checkin->customer_complaint,
                                'estimated_hours' => 1.0,
                                'labor_cost' => 0.00,
                                'technician_id' => $checkin->appointment->technician_id,
                            ];
                        }
                    }
                }

                // B. Customer Complaint Diagnosis & Service Step
                if (!empty($checkin->customer_complaint)) {
                    $alreadyIncluded = collect($servicesToCreate)->contains(function ($s) use ($checkin) {
                        return stripos($s['title'], $checkin->customer_complaint) !== false;
                    });

                    if (!$alreadyIncluded) {
                        $servicesToCreate[] = [
                            'title' => 'Diagnosis & Repair: ' . \Illuminate\Support\Str::limit($checkin->customer_complaint, 60),
                            'category' => 'Diagnostics',
                            'description' => "Investigate and resolve customer complaint: {$checkin->customer_complaint}",
                            'complaint' => $checkin->customer_complaint,
                            'estimated_hours' => 1.0,
                            'labor_cost' => 0.00,
                            'technician_id' => null,
                        ];
                    }
                }

                // C. Failed / Warning Inspection findings (each gets its own step Job Card)
                if ($checkin->checkinInspection && $checkin->checkinInspection->itemResults) {
                    foreach ($checkin->checkinInspection->itemResults as $result) {
                        if (in_array(strtolower($result->status), ['fail', 'failed', 'warning', 'needs_repair', 'damaged', 'poor'])) {
                            $itemName = $result->inspectionItem->name ?? 'Vehicle Component Inspection';
                            $servicesToCreate[] = [
                                'title' => "Repair / Service: {$itemName}",
                                'category' => 'Inspection Repair',
                                'description' => $result->notes ?: "Repair requirement found during inspection for {$itemName} (Status: {$result->status}).",
                                'complaint' => $checkin->customer_complaint,
                                'estimated_hours' => 1.0,
                                'labor_cost' => 0.00,
                                'technician_id' => null,
                            ];
                        }
                    }
                }
            }
        }

        // 3. If manual request has specific customer_complaint / service requested
        if (empty($servicesToCreate) && !empty($request?->customer_complaint)) {
            $servicesToCreate[] = [
                'title' => 'General Service: ' . \Illuminate\Support\Str::limit($request->customer_complaint, 60),
                'category' => 'General Service',
                'description' => $request->customer_complaint,
                'complaint' => $request->customer_complaint,
                'estimated_hours' => 1.0,
                'labor_cost' => 0.00,
                'technician_id' => null,
            ];
        }

        // 4. Fallback: Always ensure at least 1 comprehensive initial Job Card is created
        if (empty($servicesToCreate)) {
            $servicesToCreate[] = [
                'title' => 'Step 1: Comprehensive Diagnostic Scan & Initial Inspection',
                'category' => 'Diagnostics',
                'description' => 'Perform initial vehicle inspection, diagnostic scan, and required maintenance service.',
                'complaint' => $workOrder->checkin?->customer_complaint ?? 'Standard Service Check',
                'estimated_hours' => 1.0,
                'labor_cost' => 0.00,
                'technician_id' => null,
            ];
        }

        // Create each Job Card with explicit step number (Step 1, Step 2, Step 3, etc.)
        $stepNumber = 1;
        foreach ($servicesToCreate as $service) {
            $seq = NumberingSequence::where('entity_type', 'job_cards')->first();
            if (!$seq) {
                $seq = NumberingSequence::create([
                    'entity_type' => 'job_cards',
                    'prefix' => 'JC',
                    'next_number' => 1,
                ]);
            }
            $jobCardNumber = $seq->getNextNumber();

            $laborCost = $service['labor_cost'] ?? 0.00;
            $estHours = $service['estimated_hours'] ?? 1.0;

            \App\Models\JobCard::create([
                'job_card_number' => $jobCardNumber,
                'work_order_id' => $workOrder->work_order_id,
                'step_number' => $stepNumber,
                'job_title' => $service['title'],
                'service_category' => $service['category'] ?? 'General Service',
                'description' => $service['description'],
                'customer_complaint_related' => $service['complaint'] ?? null,
                'status' => 'draft',
                'priority' => $workOrder->priority ?? 'normal',
                'assigned_technician_id' => $service['technician_id'] ?? null,
                'estimated_labor_hours' => $estHours,
                'labor_cost' => $laborCost,
                'parts_cost' => 0.00,
                'other_cost' => 0.00,
                'estimated_total_cost' => $laborCost,
                'created_date' => now(),
            ]);

            $stepNumber++;
        }
    }

    public function splitJobCards(Request $request, WorkOrder $workOrder)
    {
        $existingJobCards = $workOrder->jobCards()->get();
        $splitCreated = 0;

        foreach ($existingJobCards as $jc) {
            $title = $jc->job_title;
            $splitServices = preg_split('/[,;\/\|]|\s+and\s+|\s+&\s+/i', $title);

            if (count($splitServices) > 1) {
                // Delete merged Job Card and create individual Job Cards per service
                $jc->delete();

                foreach ($splitServices as $singleService) {
                    $singleService = trim($singleService);
                    if (!empty($singleService)) {
                        $nextStep = ($workOrder->jobCards()->max('step_number') ?? 0) + 1;
                        $seq = NumberingSequence::where('entity_type', 'job_cards')->first();
                        if (!$seq) {
                            $seq = NumberingSequence::create([
                                'entity_type' => 'job_cards',
                                'prefix' => 'JC',
                                'next_number' => 1,
                            ]);
                        }
                        $jobCardNumber = $seq->getNextNumber();

                        \App\Models\JobCard::create([
                            'job_card_number' => $jobCardNumber,
                            'work_order_id' => $workOrder->work_order_id,
                            'step_number' => $nextStep,
                            'job_title' => $singleService,
                            'service_category' => (stripos($singleService, 'diag') !== false) ? 'Diagnostics' : 'Scheduled Maintenance',
                            'description' => "Service Step: {$singleService}",
                            'customer_complaint_related' => $jc->customer_complaint_related,
                            'status' => 'draft',
                            'priority' => $workOrder->priority ?? 'normal',
                            'assigned_technician_id' => $jc->assigned_technician_id,
                            'estimated_labor_hours' => 1.0,
                            'labor_cost' => 0.00,
                            'parts_cost' => 0.00,
                            'other_cost' => 0.00,
                            'estimated_total_cost' => 0.00,
                            'created_date' => now(),
                        ]);
                        $splitCreated++;
                    }
                }
            }
        }

        // Recalculate work order totals
        $workOrder->recalculateTotals();

        return response()->json([
            'message' => "Split merged service titles into {$splitCreated} individual Job Cards.",
            'work_order' => $workOrder->load(['jobCards.assignedTechnician', 'jobCards.parts.inventoryItem'])
        ]);
    }
}