<?php

namespace App\Http\Controllers;

use App\Models\WorkOrder;
use Illuminate\Http\Request;

class WorkOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = WorkOrder::query()->with(['customer', 'vehicle', 'branch', 'quotation']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
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
            'quotation_id' => 'required|integer|exists:quotations,quotation_id',
            'vehicle_id' => 'required|integer|exists:vehicles,vehicle_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'status' => 'nullable|string|max:20',
            'completed_at' => 'nullable|date',
        ]);

        $workOrder = WorkOrder::create($validated);
        return response()->json($workOrder, 201);
    }

    public function show(WorkOrder $workOrder)
    {
        return $workOrder->load([
            'quotation',
            'vehicle',
            'customer',
            'branch',
            'jobCards' => function ($query) {
                $query->with(['tasks', 'qualityControlChecks']);
            },
            'delivery'
        ]);
    }

    public function update(Request $request, WorkOrder $workOrder)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
            'completed_at' => 'nullable|date',
        ]);

        $workOrder->update($validated);
        return $workOrder;
    }

    public function destroy(WorkOrder $workOrder)
    {
        $workOrder->delete();
        return response()->noContent();
    }

    public function start(WorkOrder $workOrder)
    {
        $workOrder->update(['status' => 'in_progress']);
        return $workOrder;
    }

    public function complete(WorkOrder $workOrder)
    {
        $workOrder->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
        return $workOrder;
    }

    public function hold(WorkOrder $workOrder)
    {
        $workOrder->update(['status' => 'on_hold']);
        return $workOrder;
    }

    public function getByCustomer($customerId)
    {
        $workOrders = WorkOrder::where('customer_id', $customerId)
            ->with(['vehicle', 'branch'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getByVehicle($vehicleId)
    {
        $workOrders = WorkOrder::where('vehicle_id', $vehicleId)
            ->with(['customer', 'branch'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getPending()
    {
        $workOrders = WorkOrder::whereIn('status', ['open', 'on_hold'])
            ->with(['customer', 'vehicle'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getInProgress()
    {
        $workOrders = WorkOrder::where('status', 'in_progress')
            ->with(['customer', 'vehicle'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getCompleted()
    {
        $workOrders = WorkOrder::where('status', 'completed')
            ->with(['customer', 'vehicle'])
            ->latest()
            ->get();
        return $workOrders;
    }

    public function getByBranch($branchId)
    {
        $workOrders = WorkOrder::where('branch_id', $branchId)
            ->with(['customer', 'vehicle'])
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
}