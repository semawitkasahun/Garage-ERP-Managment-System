<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\EquipmentBooking;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\StockMovement;
use App\Models\JobCard;
use App\Models\JobCardPart;
use App\Models\PartsRequisition;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryDashboardController extends Controller
{
    public function getDashboardSummary(Request $request)
    {
        $branchId = $request->input('branch_id', $request->user()?->branch_id);

        // 1. PARTS INVENTORY METRICS
        $inventoryQuery = InventoryItem::with(['stock']);
        if ($branchId) {
            $inventoryQuery->whereHas('stock', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $inventoryItems = $inventoryQuery->get();

        $totalItemsCount = $inventoryItems->count();
        $totalInventoryValue = 0;
        $lowStockItems = [];
        $outOfStockItems = [];

        foreach ($inventoryItems as $item) {
            $totalQty = $item->stock ? $item->stock->sum('quantity_on_hand') : 0;
            $reorderPoint = (float) ($item->reorder_point ?? 5);
            $costPrice = (float) ($item->cost_price ?? 0);

            $itemValue = $totalQty * $costPrice;
            $totalInventoryValue += $itemValue;

            $itemData = [
                'item_id' => $item->item_id,
                'sku' => $item->sku,
                'name' => $item->name,
                'category' => $item->category ?? 'General Part',
                'unit_of_measure' => $item->unit_of_measure ?? 'pcs',
                'cost_price' => $costPrice,
                'sell_price' => (float) ($item->sell_price ?? 0),
                'quantity_on_hand' => $totalQty,
                'reorder_point' => $reorderPoint,
                'status' => $totalQty <= 0 ? 'out_of_stock' : ($totalQty <= $reorderPoint ? 'low_stock' : 'in_stock'),
            ];

            if ($totalQty <= 0) {
                $outOfStockItems[] = $itemData;
            } elseif ($totalQty <= $reorderPoint) {
                $lowStockItems[] = $itemData;
            }
        }

        $lowStockCount = count($lowStockItems);
        $outOfStockCount = count($outOfStockItems);

        // Received and issued this month
        $startOfMonth = now()->startOfMonth();
        $itemsReceivedThisMonth = (float) StockMovement::where('movement_type', 'in')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('quantity');

        $itemsIssuedThisMonth = (float) StockMovement::where('movement_type', 'out')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('quantity');

        // 2. EQUIPMENT / ASSETS METRICS
        $assetQuery = Asset::with(['branch', 'bookings.bookedBy', 'bookings.jobCard']);
        if ($branchId) {
            $assetQuery->where('branch_id', $branchId);
        }
        $assets = $assetQuery->get();

        $totalEquipmentCount = $assets->count();
        $equipmentUnderMaintenance = $assets->where('status', 'maintenance')->count();
        $missingEquipment = $assets->whereIn('status', ['disposed', 'missing'])->count();

        // Equipment Bookings
        $bookingQuery = EquipmentBooking::with(['asset', 'bookedBy.employee', 'jobCard.workOrder']);
        $bookings = $bookingQuery->latest()->get();

        $checkedOutBookings = $bookings->filter(fn ($b) => in_array($b->status, ['active', 'checked_out', 'confirmed']));
        $equipmentCheckedOutCount = $checkedOutBookings->count();

        $now = now();
        $overdueBookings = $checkedOutBookings->filter(fn ($b) => $b->end_time && $b->end_time < $now);
        $overdueEquipmentCount = $overdueBookings->count();

        $pendingRequests = $bookings->filter(fn ($b) => $b->status === 'pending');
        $pendingEquipmentRequestsCount = $pendingRequests->count();

        $availableEquipmentCount = max(0, $totalEquipmentCount - $equipmentCheckedOutCount - $equipmentUnderMaintenance - $missingEquipment);

        // Build Equipment Accountability Table List
        $equipmentAccountabilityList = $bookings->map(function ($b) use ($now) {
            $isCheckedOut = in_array($b->status, ['active', 'checked_out', 'confirmed']);
            $isOverdue = $isCheckedOut && $b->end_time && $b->end_time < $now;

            $statusLabel = $b->status;
            if ($isOverdue) {
                $statusLabel = 'overdue';
            } elseif ($b->status === 'active' || $b->status === 'checked_out') {
                $statusLabel = 'checked_out';
            }

            $bookedByName = 'Unassigned';
            if ($b->bookedBy) {
                $bookedByName = $b->bookedBy->employee 
                    ? trim("{$b->bookedBy->employee->first_name} {$b->bookedBy->employee->last_name}")
                    : $b->bookedBy->username;
            }

            $jobCardTitle = 'N/A';
            if ($b->jobCard) {
                $jobCardTitle = "JC-{$b->jobCard->job_card_id} ({$b->jobCard->job_title})";
            }

            return [
                'booking_id' => $b->booking_id,
                'asset_id' => $b->asset_id,
                'equipment_name' => $b->asset->name ?? 'Equipment Tool',
                'equipment_code' => 'EQ-' . str_pad($b->asset_id ?? 1, 4, '0', STR_PAD_LEFT),
                'assigned_to' => $bookedByName,
                'job_card' => $jobCardTitle,
                'checkout_time' => $b->start_time ? $b->start_time->format('Y-m-d H:i') : 'N/A',
                'expected_return' => $b->end_time ? $b->end_time->format('Y-m-d H:i') : 'N/A',
                'status' => $statusLabel,
            ];
        })->values();

        // Build Pending Technician Requests Table List
        $pendingRequestsList = $pendingRequests->map(function ($b) {
            $techName = 'Technician';
            if ($b->bookedBy) {
                $techName = $b->bookedBy->employee 
                    ? trim("{$b->bookedBy->employee->first_name} {$b->bookedBy->employee->last_name}")
                    : $b->bookedBy->username;
            }

            return [
                'booking_id' => $b->booking_id,
                'technician_name' => $techName,
                'requested_equipment' => $b->asset->name ?? 'Equipment Tool',
                'job_card' => $b->jobCard ? "JC-{$b->jobCard->job_card_id} ({$b->jobCard->job_title})" : 'General Request',
                'date' => $b->created_at ? $b->created_at->format('Y-m-d H:i') : now()->format('Y-m-d H:i'),
                'status' => 'pending',
            ];
        })->values();

        // Build System UI Alerts
        $alerts = [];

        if ($outOfStockCount > 0) {
            $alerts[] = [
                'id' => 'alert-out-of-stock',
                'type' => 'danger',
                'title' => 'Out of Stock Alert',
                'message' => "{$outOfStockCount} inventory items are completely out of stock and require immediate replenishment.",
            ];
        }

        if ($lowStockCount > 0) {
            $alerts[] = [
                'id' => 'alert-low-stock',
                'type' => 'warning',
                'title' => 'Low Stock Warning',
                'message' => "{$lowStockCount} items have reached reorder thresholds.",
            ];
        }

        if ($overdueEquipmentCount > 0) {
            $alerts[] = [
                'id' => 'alert-overdue-equipment',
                'type' => 'danger',
                'title' => 'Overdue Equipment Alert',
                'message' => "{$overdueEquipmentCount} equipment tool(s) are past their expected return deadline.",
            ];
        }

        if ($equipmentUnderMaintenance > 0) {
            $alerts[] = [
                'id' => 'alert-maintenance',
                'type' => 'info',
                'title' => 'Equipment Maintenance Required',
                'message' => "{$equipmentUnderMaintenance} equipment tool(s) are currently undergoing maintenance.",
            ];
        }

        return response()->json([
            'summary' => [
                'total_items' => $totalItemsCount,
                'low_stock' => $lowStockCount,
                'out_of_stock' => $outOfStockCount,
                'total_equipment' => $totalEquipmentCount,
                'equipment_checked_out' => $equipmentCheckedOutCount,
                'overdue_equipment' => $overdueEquipmentCount,
                'pending_equipment_requests' => $pendingEquipmentRequestsCount,
                'equipment_in_maintenance' => $equipmentUnderMaintenance,
            ],
            'stock_overview' => [
                'total_inventory_value' => round($totalInventoryValue, 2),
                'items_received_this_month' => $itemsReceivedThisMonth,
                'items_issued_this_month' => $itemsIssuedThisMonth,
                'low_stock_items' => $lowStockItems,
                'out_of_stock_items' => $outOfStockItems,
            ],
            'equipment_accountability' => [
                'available_equipment' => $availableEquipmentCount,
                'currently_checked_out' => $equipmentCheckedOutCount,
                'overdue_equipment' => $overdueEquipmentCount,
                'missing_equipment' => $missingEquipment,
                'equipment_under_maintenance' => $equipmentUnderMaintenance,
                'list' => $equipmentAccountabilityList,
            ],
            'pending_requests' => $pendingRequestsList,
            'alerts' => $alerts,
        ]);
    }

    public function receiveStock(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $branchId = $request->user()->branch_id ?? 1;

        $stock = InventoryStock::firstOrCreate(
            ['item_id' => $validated['item_id'], 'branch_id' => $branchId],
            ['quantity_on_hand' => 0, 'quantity_reserved' => 0]
        );

        $stock->increment('quantity_on_hand', $validated['quantity']);

        // Log movement
        StockMovement::create([
            'item_id' => $validated['item_id'],
            'branch_id' => $branchId,
            'movement_type' => 'in',
            'quantity' => $validated['quantity'],
            'reference_type' => 'stock_receipt',
            'notes' => $validated['notes'] ?? 'Manual stock receipt',
            'created_by' => $request->user()->user_id,
        ]);

        return response()->json(['message' => 'Stock received successfully', 'stock' => $stock]);
    }

    public function issueParts(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|integer|exists:inventory_items,item_id',
            'job_card_id' => 'nullable|integer|exists:job_cards,job_card_id',
            'quantity' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        $branchId = $request->user()->branch_id ?? 1;

        $stock = InventoryStock::where('item_id', $validated['item_id'])
            ->where('branch_id', $branchId)
            ->first();

        if (!$stock || $stock->quantity_on_hand < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock on hand to issue this quantity.'], 422);
        }

        $stock->decrement('quantity_on_hand', $validated['quantity']);

        StockMovement::create([
            'item_id' => $validated['item_id'],
            'branch_id' => $branchId,
            'movement_type' => 'out',
            'quantity' => $validated['quantity'],
            'reference_type' => 'job_card_issue',
            'reference_id' => $validated['job_card_id'] ?? null,
            'notes' => $validated['notes'] ?? 'Issued parts for job card',
            'created_by' => $request->user()->user_id,
        ]);

        return response()->json(['message' => 'Parts issued successfully', 'stock' => $stock]);
    }

    public function assignEquipment(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|integer|exists:assets,asset_id',
            'booked_by' => 'required|integer|exists:users,user_id',
            'job_card_id' => 'nullable|integer|exists:job_cards,job_card_id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $booking = EquipmentBooking::create([
            'asset_id' => $validated['asset_id'],
            'booked_by' => $validated['booked_by'],
            'job_card_id' => $validated['job_card_id'] ?? null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'active',
        ]);

        return response()->json(['message' => 'Equipment assigned successfully', 'booking' => $booking], 201);
    }

    public function approveEquipmentRequest(EquipmentBooking $booking)
    {
        $booking->update(['status' => 'active']);
        return response()->json(['message' => 'Equipment request approved', 'booking' => $booking]);
    }

    public function rejectEquipmentRequest(EquipmentBooking $booking)
    {
        $booking->update(['status' => 'rejected']);
        return response()->json(['message' => 'Equipment request rejected', 'booking' => $booking]);
    }

    public function returnEquipment(EquipmentBooking $booking)
    {
        $booking->update(['status' => 'completed']);
        return response()->json(['message' => 'Equipment returned successfully', 'booking' => $booking]);
    }
}
