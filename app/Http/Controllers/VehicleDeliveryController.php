<?php

namespace App\Http\Controllers;

use App\Models\VehicleDelivery;
use Illuminate\Http\Request;

class VehicleDeliveryController extends Controller
{
    public function index(Request $request)
    {
        $query = VehicleDelivery::query()->with(['workOrder', 'deliveredBy']);

        if ($request->has('work_order_id')) {
            $query->where('work_order_id', $request->work_order_id);
        }

        if ($request->has('delivered_by')) {
            $query->where('delivered_by', $request->delivered_by);
        }

        if ($request->has('from_date')) {
            $query->whereDate('delivered_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('delivered_at', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'work_order_id' => 'required|integer|exists:work_orders,work_order_id',
            'delivered_by' => 'required|integer|exists:users,user_id',
            'customer_signature_file' => 'nullable|string|max:255',
            'delivery_checklist_notes' => 'nullable|string',
            'feedback_rating' => 'nullable|integer|min:1|max:5',
            'feedback_comments' => 'nullable|string',
        ]);

        $delivery = VehicleDelivery::create($validated);
        return response()->json($delivery, 201);
    }

    public function show(VehicleDelivery $vehicleDelivery)
    {
        return $vehicleDelivery->load([
            'workOrder',
            'deliveredBy'
        ]);
    }

    public function update(Request $request, VehicleDelivery $vehicleDelivery)
    {
        $validated = $request->validate([
            'customer_signature_file' => 'nullable|string|max:255',
            'delivery_checklist_notes' => 'nullable|string',
            'feedback_rating' => 'nullable|integer|min:1|max:5',
            'feedback_comments' => 'nullable|string',
        ]);

        $vehicleDelivery->update($validated);
        return $vehicleDelivery;
    }

    public function destroy(VehicleDelivery $vehicleDelivery)
    {
        $vehicleDelivery->delete();
        return response()->noContent();
    }

    public function complete(VehicleDelivery $vehicleDelivery)
    {
        $vehicleDelivery->update(['delivered_at' => now()]);
        
        // Update work order status
        $vehicleDelivery->workOrder->update(['status' => 'completed']);

        return $vehicleDelivery;
    }

    public function addFeedback(Request $request, VehicleDelivery $vehicleDelivery)
    {
        $validated = $request->validate([
            'feedback_rating' => 'required|integer|min:1|max:5',
            'feedback_comments' => 'nullable|string',
        ]);

        $vehicleDelivery->update($validated);
        return $vehicleDelivery;
    }

    public function getByWorkOrder($workOrderId)
    {
        $deliveries = VehicleDelivery::where('work_order_id', $workOrderId)
            ->with(['deliveredBy'])
            ->latest()
            ->get();
        return $deliveries;
    }

    public function getPending()
    {
        $deliveries = VehicleDelivery::whereNull('delivered_at')
            ->with(['workOrder'])
            ->latest()
            ->get();
        return $deliveries;
    }

    public function getCompleted()
    {
        $deliveries = VehicleDelivery::whereNotNull('delivered_at')
            ->with(['workOrder'])
            ->latest()
            ->get();
        return $deliveries;
    }

    public function getFeedbackSummary()
    {
        $summary = [
            'total_deliveries' => VehicleDelivery::count(),
            'average_rating' => VehicleDelivery::avg('feedback_rating'),
            'total_ratings' => VehicleDelivery::whereNotNull('feedback_rating')->count(),
            'rating_distribution' => VehicleDelivery::select('feedback_rating', \DB::raw('count(*) as count'))
                ->whereNotNull('feedback_rating')
                ->groupBy('feedback_rating')
                ->orderBy('feedback_rating', 'desc')
                ->get(),
        ];
        return $summary;
    }
}