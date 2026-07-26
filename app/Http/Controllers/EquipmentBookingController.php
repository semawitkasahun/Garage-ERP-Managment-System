<?php

namespace App\Http\Controllers;

use App\Models\EquipmentBooking;
use Illuminate\Http\Request;

class EquipmentBookingController extends Controller
{
    public function index(Request $request)
    {
        $query = EquipmentBooking::query()->with(['asset', 'bookedBy', 'jobCard']);

        if ($request->has('asset_id')) {
            $query->where('asset_id', $request->asset_id);
        }

        if ($request->has('booked_by')) {
            $query->where('booked_by', $request->booked_by);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('start_time', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('end_time', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|integer|exists:assets,asset_id',
            'booked_by' => 'required|integer|exists:users,user_id',
            'job_card_id' => 'nullable|integer|exists:job_cards,job_card_id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'nullable|string|max:20',
        ]);

        // Check availability
        $conflict = EquipmentBooking::where('asset_id', $validated['asset_id'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                    });
            })
            ->whereIn('status', ['active', 'confirmed'])
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Equipment is already booked for this time slot'
            ], 422);
        }

        $booking = EquipmentBooking::create($validated);
        return response()->json($booking, 201);
    }

    public function show(EquipmentBooking $equipmentBooking)
    {
        return $equipmentBooking->load(['asset', 'bookedBy', 'jobCard']);
    }

    public function update(Request $request, EquipmentBooking $equipmentBooking)
    {
        $validated = $request->validate([
            'status' => 'nullable|string|max:20',
        ]);

        $equipmentBooking->update($validated);
        return $equipmentBooking;
    }

    public function destroy(EquipmentBooking $equipmentBooking)
    {
        $equipmentBooking->delete();
        return response()->noContent();
    }

    public function confirm(EquipmentBooking $equipmentBooking)
    {
        $equipmentBooking->update(['status' => 'confirmed']);
        return $equipmentBooking;
    }

    public function start(EquipmentBooking $equipmentBooking)
    {
        $equipmentBooking->update(['status' => 'active']);
        return $equipmentBooking;
    }

    public function complete(EquipmentBooking $equipmentBooking)
    {
        $equipmentBooking->update(['status' => 'completed']);
        return $equipmentBooking;
    }

    public function cancel(EquipmentBooking $equipmentBooking)
    {
        $equipmentBooking->update(['status' => 'cancelled']);
        return $equipmentBooking;
    }

    public function getByAsset($assetId)
    {
        $bookings = EquipmentBooking::where('asset_id', $assetId)
            ->with(['bookedBy', 'jobCard'])
            ->latest()
            ->get();
        return $bookings;
    }

    public function getByJobCard($jobCardId)
    {
        $bookings = EquipmentBooking::where('job_card_id', $jobCardId)
            ->with(['asset', 'bookedBy'])
            ->latest()
            ->get();
        return $bookings;
    }

    public function getAvailability(Request $request)
    {
        $validated = $request->validate([
            'asset_id' => 'required|integer|exists:assets,asset_id',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
        ]);

        $conflicts = EquipmentBooking::where('asset_id', $validated['asset_id'])
            ->where(function ($query) use ($validated) {
                $query->whereBetween('start_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhereBetween('end_time', [$validated['start_time'], $validated['end_time']])
                    ->orWhere(function ($q) use ($validated) {
                        $q->where('start_time', '<=', $validated['start_time'])
                            ->where('end_time', '>=', $validated['end_time']);
                    });
            })
            ->whereIn('status', ['active', 'confirmed'])
            ->get();

        return response()->json([
            'asset_id' => $validated['asset_id'],
            'is_available' => $conflicts->isEmpty(),
            'conflicts' => $conflicts,
        ]);
    }
}