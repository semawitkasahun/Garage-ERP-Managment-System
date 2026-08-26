<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\WorkOrderActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        $query = Quotation::query()->with(['vehicle', 'customer', 'createdBy', 'workOrder']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('work_order_id')) {
            $query->where('work_order_id', $request->work_order_id);
        }

        if ($request->has('checkin_id')) {
            $query->where('checkin_id', $request->checkin_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_approval_status')) {
            $query->where('customer_approval_status', $request->customer_approval_status);
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
            'work_order_id' => 'nullable|integer|exists:work_orders,work_order_id',
            'checkin_id' => 'nullable|integer|exists:vehicle_checkins,checkin_id',
            'inspection_id' => 'nullable|integer|exists:inspections,inspection_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'status' => 'nullable|in:draft,sent,approved,rejected',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
        ]);

        $quotation = Quotation::create([
            'work_order_id' => $validated['work_order_id'] ?? null,
            'checkin_id' => $validated['checkin_id'] ?? null,
            'inspection_id' => $validated['inspection_id'] ?? null,
            'vehicle_id' => $validated['vehicle_id'],
            'customer_id' => $validated['customer_id'],
            'status' => $validated['status'] ?? 'draft',
            'customer_approval_status' => 'draft',
            'subtotal' => $validated['subtotal'] ?? 0,
            'tax_amount' => $validated['tax_amount'] ?? 0,
            'discount_amount' => $validated['discount_amount'] ?? 0,
            'total_amount' => $validated['total_amount'] ?? 0,
            'created_by' => $request->user()->user_id,
        ]);

        // Log activity if work order exists
        if ($quotation->work_order_id) {
            WorkOrderActivity::create([
                'work_order_id' => $quotation->work_order_id,
                'action' => 'quotation_created',
                'description' => 'Quotation created for Work Order',
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
                'new_values' => $quotation->toArray(),
            ]);
        }

        return response()->json($quotation->load(['vehicle', 'customer', 'createdBy']), 201);
    }

    public function show(Quotation $quotation)
    {
        return $quotation->load([
            'vehicle',
            'customer',
            'createdBy',
            'customerApprovedBy',
            'workOrder',
            'checkin',
            'items' => function ($query) {
                $query->with('inventoryItem');
            }
        ]);
    }

    public function update(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:draft,sent,approved,rejected',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
        ]);

        $oldValues = $quotation->toArray();
        $quotation->update($validated);

        // Log activity if status changed
        if (isset($validated['status']) && $validated['status'] !== $oldValues['status']) {
            if ($quotation->work_order_id) {
                WorkOrderActivity::create([
                    'work_order_id' => $quotation->work_order_id,
                    'action' => 'quotation_status_changed',
                    'description' => "Quotation status changed to {$validated['status']}",
                    'performed_by' => $request->user()->user_id,
                    'performed_at' => now(),
                    'old_values' => ['status' => $oldValues['status']],
                    'new_values' => ['status' => $validated['status']],
                ]);
            }
        }

        return $quotation;
    }

    public function destroy(Quotation $quotation)
    {
        $quotation->delete();
        return response()->noContent();
    }

    public function sendToCustomer(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'sent_via' => 'required|in:email,sms,whatsapp,personal',
        ]);

        $quotation->update([
            'status' => 'sent',
            'customer_approval_status' => 'pending_approval',
            'sent_to_customer_at' => now(),
            'sent_via' => $validated['sent_via'],
        ]);

        // Log activity
        if ($quotation->work_order_id) {
            WorkOrderActivity::create([
                'work_order_id' => $quotation->work_order_id,
                'action' => 'quotation_sent',
                'description' => "Quotation sent to customer via {$validated['sent_via']}",
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
            ]);
        }

        return $quotation;
    }

    public function customerApprove(Request $request, Quotation $quotation)
    {
        $quotation->update([
            'status' => 'approved',
            'customer_approval_status' => 'approved',
            'customer_approved_at' => now(),
            'customer_approved_by' => $request->user()->user_id,
        ]);

        // Update work order status if exists
        if ($quotation->work_order_id) {
            $quotation->workOrder->update(['status' => 'approved']);

            WorkOrderActivity::create([
                'work_order_id' => $quotation->work_order_id,
                'action' => 'quotation_approved',
                'description' => 'Customer approved quotation',
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
            ]);
        }

        return $quotation->load('workOrder');
    }

    public function customerReject(Request $request, Quotation $quotation)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $quotation->update([
            'status' => 'rejected',
            'customer_approval_status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Update work order status if exists
        if ($quotation->work_order_id) {
            $quotation->workOrder->update(['status' => 'awaiting_approval']);

            WorkOrderActivity::create([
                'work_order_id' => $quotation->work_order_id,
                'action' => 'quotation_rejected',
                'description' => 'Customer rejected quotation',
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
                'new_values' => ['rejection_reason' => $validated['rejection_reason']],
            ]);
        }

        return $quotation;
    }

    public function generateFromJobCards(Request $request)
    {
        $validated = $request->validate([
            'work_order_id' => 'required|integer|exists:work_orders,work_order_id',
        ]);

        $workOrder = \App\Models\WorkOrder::with(['jobCards.parts.inventoryItem'])->find($validated['work_order_id']);
        
        $quotation = DB::transaction(function () use ($workOrder, $request) {
            // Check if quotation already exists for this work order
            $quotation = Quotation::where('work_order_id', $workOrder->work_order_id)->first();

            if ($quotation) {
                // Delete existing items to regenerate fresh items from current Job Cards
                QuotationItem::where('quotation_id', $quotation->quotation_id)->delete();
            } else {
                // Create numbering sequence if needed
                $sequence = \App\Models\NumberingSequence::where('entity_type', 'quotations')->first();
                if (!$sequence) {
                    $sequence = \App\Models\NumberingSequence::create([
                        'entity_type' => 'quotations',
                        'prefix' => 'QTN',
                        'next_number' => 1,
                    ]);
                }
                $quotationNumber = $sequence->getNextNumber();

                // Create new quotation
                $quotation = Quotation::create([
                    'quotation_number' => $quotationNumber,
                    'work_order_id' => $workOrder->work_order_id,
                    'checkin_id' => $workOrder->checkin_id,
                    'vehicle_id' => $workOrder->vehicle_id,
                    'customer_id' => $workOrder->customer_id,
                    'status' => 'draft',
                    'customer_approval_status' => 'draft',
                    'subtotal' => 0,
                    'tax_amount' => 0,
                    'discount_amount' => 0,
                    'total_amount' => 0,
                    'created_by' => $request->user()->user_id,
                ]);
            }

            // Generate quotation items from job cards
            $subtotal = 0;
            foreach ($workOrder->jobCards as $jobCard) {
                // Add labor item
                if ($jobCard->labor_cost > 0) {
                    $hours = max((float)$jobCard->estimated_labor_hours, 1);
                    QuotationItem::create([
                        'quotation_id' => $quotation->quotation_id,
                        'item_type' => 'labor',
                        'description' => "Labor: {$jobCard->job_title}",
                        'quantity' => $jobCard->estimated_labor_hours ?: 1,
                        'unit_price' => $jobCard->labor_cost / $hours,
                        'line_total' => $jobCard->labor_cost,
                    ]);
                    $subtotal += $jobCard->labor_cost;
                }

                // Add parts items if individual inventory items exist
                $hasInventoryParts = false;
                if ($jobCard->parts && $jobCard->parts->count() > 0) {
                    foreach ($jobCard->parts as $part) {
                        if ($part->total_cost > 0) {
                            $hasInventoryParts = true;
                            QuotationItem::create([
                                'quotation_id' => $quotation->quotation_id,
                                'item_type' => 'parts',
                                'inventory_item_id' => $part->inventory_item_id,
                                'description' => $part->inventoryItem->name ?? "Part for {$jobCard->job_title}",
                                'quantity' => $part->requested_quantity ?: 1,
                                'unit_price' => $part->unit_cost ?: $part->total_cost,
                                'line_total' => $part->total_cost,
                            ]);
                            $subtotal += $part->total_cost;
                        }
                    }
                }

                // Fallback: If flat parts_cost was entered directly without selecting inventory items
                if (!$hasInventoryParts && $jobCard->parts_cost > 0) {
                    QuotationItem::create([
                        'quotation_id' => $quotation->quotation_id,
                        'item_type' => 'parts',
                        'description' => "Parts & Materials: {$jobCard->job_title}",
                        'quantity' => 1,
                        'unit_price' => $jobCard->parts_cost,
                        'line_total' => $jobCard->parts_cost,
                    ]);
                    $subtotal += $jobCard->parts_cost;
                }

                // Add other costs
                if ($jobCard->other_cost > 0) {
                    QuotationItem::create([
                        'quotation_id' => $quotation->quotation_id,
                        'item_type' => 'other',
                        'description' => "Other Charges: {$jobCard->job_title}",
                        'quantity' => 1,
                        'unit_price' => $jobCard->other_cost,
                        'line_total' => $jobCard->other_cost,
                    ]);
                    $subtotal += $jobCard->other_cost;
                }
            }

            // Calculate totals (15% VAT)
            $taxAmount = $subtotal * 0.15;
            $totalAmount = $subtotal + $taxAmount;

            $quotation->update([
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
            ]);

            // Link quotation to work order
            $workOrder->update(['quotation_id' => $quotation->quotation_id]);

            // Log activity
            WorkOrderActivity::create([
                'work_order_id' => $workOrder->work_order_id,
                'action' => 'quotation_generated',
                'description' => "Quotation #{$quotation->quotation_number} generated from Job Cards (Total: ETB " . number_format($totalAmount, 2) . ")",
                'performed_by' => $request->user()->user_id,
                'performed_at' => now(),
            ]);

            return $quotation;
        });

        return response()->json($quotation->load(['items', 'workOrder']), 200);
    }

    public function getByCustomer($customerId)
    {
        $quotations = Quotation::where('customer_id', $customerId)
            ->with(['vehicle', 'createdBy', 'workOrder'])
            ->latest()
            ->get();
        return $quotations;
    }

    public function getByVehicle($vehicleId)
    {
        $quotations = Quotation::where('vehicle_id', $vehicleId)
            ->with(['customer', 'createdBy', 'workOrder'])
            ->latest()
            ->get();
        return $quotations;
    }

    public function getByWorkOrder($workOrderId)
    {
        $quotation = Quotation::where('work_order_id', $workOrderId)
            ->with(['items', 'vehicle', 'customer'])
            ->first();
        return $quotation;
    }

    public function getByCheckin($checkinId)
    {
        $quotation = Quotation::where('checkin_id', $checkinId)
            ->with(['items', 'vehicle', 'customer'])
            ->first();
        return $quotation;
    }
}