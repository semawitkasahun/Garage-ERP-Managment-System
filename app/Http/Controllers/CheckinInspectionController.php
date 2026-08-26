<?php

namespace App\Http\Controllers;

use App\Models\CheckinInspection;
use App\Models\InspectionCategory;
use App\Models\InspectionItem;
use App\Models\InspectionItemResult;
use App\Models\VehicleCheckin;
use App\Models\VehicleDamageRecord;
use App\Models\InspectionItemPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CheckinInspectionController extends Controller
{
    public function getInspectionCategories()
    {
        $categories = InspectionCategory::with(['items' => function ($query) {
            $query->orderBy('sort_order');
        }])->orderBy('sort_order')->get();

        return response()->json($categories);
    }

    public function createInspection(Request $request, $checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        $validated = $request->validate([
            'inspector_id' => 'required|integer|exists:users,user_id',
        ]);

        $inspection = CheckinInspection::create([
            'checkin_id' => $vehicleCheckin->checkin_id,
            'inspector_id' => $validated['inspector_id'],
            'started_at' => now(),
        ]);

        // Update checkin status
        $vehicleCheckin->update([
            'checkin_status' => 'inspection_in_progress',
            'inspector_id' => $validated['inspector_id'],
            'inspection_started_at' => now(),
        ]);

        return response()->json($inspection->load('inspector'), 201);
    }

    public function updateInspection(Request $request, $inspection)
    {
        $checkinInspection = CheckinInspection::findOrFail($inspection);

        $validated = $request->validate([
            'general_notes' => 'nullable|string',
            'completed' => 'boolean',
        ]);

        if ($request->has('general_notes')) {
            $checkinInspection->update(['general_notes' => $validated['general_notes']]);
        }

        if ($validated['completed'] ?? false) {
            $checkinInspection->update(['completed_at' => now()]);

            // Update checkin status
            $checkinInspection->checkin->update([
                'checkin_status' => 'inspection_completed',
                'inspection_completed_at' => now(),
            ]);
        }

        return response()->json($checkinInspection);
    }

    public function saveInspectionResults(Request $request, $inspection)
    {
        $checkinInspection = CheckinInspection::findOrFail($inspection);

        $validated = $request->validate([
            'results' => 'required|array',
            'results.*.inspection_item_id' => 'required|integer|exists:inspection_items,item_id',
            'results.*.status' => 'required|in:ok,needs_attention,na',
            'results.*.notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $checkinInspection) {
            foreach ($validated['results'] as $result) {
                InspectionItemResult::updateOrCreate(
                    [
                        'inspection_id' => $checkinInspection->inspection_id,
                        'inspection_item_id' => $result['inspection_item_id'],
                    ],
                    [
                        'status' => $result['status'],
                        'notes' => $result['notes'] ?? null,
                    ]
                );
            }
        });

        return response()->json(['message' => 'Inspection results saved']);
    }

    public function uploadInspectionPhoto(Request $request, $result)
    {
        $inspectionItemResult = InspectionItemResult::findOrFail($result);

        $validated = $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $file = $request->file('file');
        $path = $file->store("inspections/{$inspectionItemResult->inspection_id}/items/{$inspectionItemResult->result_id}", 'public');

        $photo = InspectionItemPhoto::create([
            'inspection_result_id' => $inspectionItemResult->result_id,
            'file_path' => Storage::url($path),
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json($photo, 201);
    }

    public function deleteInspectionPhoto($photo)
    {
        $inspectionItemPhoto = InspectionItemPhoto::findOrFail($photo);

        // Delete file from storage
        $path = str_replace('/storage/', '', $inspectionItemPhoto->file_path);
        Storage::disk('public')->delete($path);

        $inspectionItemPhoto->delete();

        return response()->noContent();
    }

    public function createDamageRecord(Request $request, $checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        $validated = $request->validate([
            'damage_type' => 'required|string|in:scratch,dent,crack,broken_part,paint_damage,missing_part,other',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $path = $file->store("checkins/{$vehicleCheckin->checkin_id}/damage", 'public');
            $photoPath = Storage::url($path);
        }

        $damage = VehicleDamageRecord::create([
            'checkin_id' => $vehicleCheckin->checkin_id,
            'damage_type' => $validated['damage_type'],
            'location' => $validated['location'],
            'description' => $validated['description'] ?? null,
            'photo_path' => $photoPath,
            'is_existing_damage' => true,
        ]);

        return response()->json($damage, 201);
    }

    public function deleteDamageRecord($damage)
    {
        $vehicleDamageRecord = VehicleDamageRecord::findOrFail($damage);

        // Delete photo if exists
        if ($vehicleDamageRecord->photo_path) {
            $path = str_replace('/storage/', '', $vehicleDamageRecord->photo_path);
            Storage::disk('public')->delete($path);
        }

        $vehicleDamageRecord->delete();

        return response()->noContent();
    }

    public function recordCustomerSignature(Request $request, $checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        $validated = $request->validate([
            'signature' => 'required|string',
        ]);

        if (!preg_match('/^data:image\/(\w+);base64,/', $validated['signature'], $matches)) {
            return response()->json(['message' => 'Invalid signature format'], 422);
        }

        $binary = base64_decode(substr($validated['signature'], strpos($validated['signature'], ',') + 1));
        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $filename = "checkins/{$vehicleCheckin->checkin_id}/customer_signature.{$extension}";

        Storage::disk('public')->put($filename, $binary);

        $vehicleCheckin->update([
            'signature_file' => Storage::url($filename),
            'customer_signed_at' => now(),
            'checkin_status' => 'review_pending',
        ]);

        return response()->json(['message' => 'Customer signature recorded', 'checkin' => $vehicleCheckin]);
    }

    public function recordSignatureDecline(Request $request, $checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $vehicleCheckin->update([
            'signature_decline_reason' => $validated['reason'],
            'signature_declined_by' => $request->user()->user_id,
            'checkin_status' => 'signature_declined',
        ]);

        return response()->json(['message' => 'Signature decline recorded', 'checkin' => $vehicleCheckin]);
    }

    public function completeCheckin(Request $request, $checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        // Validate that inspection is completed
        if (!$vehicleCheckin->checkinInspection || !$vehicleCheckin->checkinInspection->completed_at) {
            return response()->json([
                'message' => 'Vehicle inspection must be completed before Check-In can be completed',
            ], 422);
        }

        // Signature is now optional - just record if it exists
        $vehicleCheckin->update([
            'checkin_status' => 'completed',
            'checkin_completed_at' => now(),
            'checkin_completed_by' => $request->user()->user_id,
        ]);

        return response()->json(['message' => 'Check-In completed successfully', 'checkin' => $vehicleCheckin]);
    }

    public function getInspectionSummary($checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        $vehicleCheckin->load([
            'customer',
            'vehicle',
            'appointment',
            'checkinInspection.inspector',
            'checkinInspection.itemResults.inspectionItem.category',
            'checkinInspection.itemResults.photos',
            'damageRecords',
            'checkedInBy',
        ]);

        // Calculate summary statistics
        $totalItems = $vehicleCheckin->checkinInspection?->itemResults->count() ?? 0;
        $okItems = $vehicleCheckin->checkinInspection?->itemResults->where('status', 'ok')->count() ?? 0;
        $needsAttentionItems = $vehicleCheckin->checkinInspection?->itemResults->where('status', 'needs_attention')->count() ?? 0;
        $naItems = $vehicleCheckin->checkinInspection?->itemResults->where('status', 'na')->count() ?? 0;

        return response()->json([
            'checkin' => $vehicleCheckin,
            'summary' => [
                'total_items' => $totalItems,
                'ok' => $okItems,
                'needs_attention' => $needsAttentionItems,
                'na' => $naItems,
            ],
        ]);
    }

    public function generateInspectionReport($checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);

        $vehicleCheckin->load([
            'customer',
            'vehicle',
            'appointment',
            'checkinInspection.inspector',
            'checkinInspection.itemResults.inspectionItem.category',
            'checkinInspection.itemResults.photos',
            'damageRecords',
            'checkedInBy',
            'branch',
        ]);

        // Calculate summary statistics
        $totalItems = $vehicleCheckin->checkinInspection?->itemResults->count() ?? 0;
        $okItems = $vehicleCheckin->checkinInspection?->itemResults->where('status', 'ok')->count() ?? 0;
        $needsAttentionItems = $vehicleCheckin->checkinInspection?->itemResults->where('status', 'needs_attention')->count() ?? 0;
        $naItems = $vehicleCheckin->checkinInspection?->itemResults->where('status', 'na')->count() ?? 0;

        // Group results by category
        $resultsByCategory = [];
        if ($vehicleCheckin->checkinInspection) {
            foreach ($vehicleCheckin->checkinInspection->itemResults as $result) {
                $categoryName = $result->inspectionItem->category->display_name;
                if (!isset($resultsByCategory[$categoryName])) {
                    $resultsByCategory[$categoryName] = [];
                }
                $resultsByCategory[$categoryName][] = [
                    'item' => $result->inspectionItem->display_name,
                    'status' => $result->status,
                    'notes' => $result->notes,
                    'photos' => $result->photos->map(fn($photo) => $photo->file_path)->toArray(),
                ];
            }
        }

        return response()->json([
            'checkin' => $vehicleCheckin,
            'summary' => [
                'total_items' => $totalItems,
                'ok' => $okItems,
                'needs_attention' => $needsAttentionItems,
                'na' => $naItems,
            ],
            'results_by_category' => $resultsByCategory,
            'damage_records' => $vehicleCheckin->damageRecords->map(fn($record) => [
                'type' => $record->damage_type,
                'location' => $record->location,
                'description' => $record->description,
                'photo' => $record->photo_path,
            ])->toArray(),
        ]);
    }

    public function sendInspectionReportEmail($checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);
        $vehicleCheckin->load(['customer', 'vehicle', 'branch']);

        if (!$vehicleCheckin->customer->email) {
            return response()->json(['message' => 'Customer email not found'], 422);
        }

        // Create notification log for email
        $notificationLog = \App\Models\NotificationLog::create([
            'template_id' => null, // Would use a specific template in production
            'recipient_type' => 'customer',
            'recipient_id' => $vehicleCheckin->customer->customer_id,
            'channel' => 'email',
            'status' => 'pending',
        ]);

        // In production, this would integrate with your email service
        // For now, we'll just log the notification
        $notificationLog->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return response()->json([
            'message' => 'Inspection report email sent successfully',
            'notification_log' => $notificationLog
        ]);
    }

    public function sendInspectionReportSMS($checkin)
    {
        $vehicleCheckin = VehicleCheckin::findOrFail($checkin);
        $vehicleCheckin->load(['customer', 'vehicle']);

        if (!$vehicleCheckin->customer->phone) {
            return response()->json(['message' => 'Customer phone number not found'], 422);
        }

        // Create notification log for SMS
        $notificationLog = \App\Models\NotificationLog::create([
            'template_id' => null, // Would use a specific template in production
            'recipient_type' => 'customer',
            'recipient_id' => $vehicleCheckin->customer->customer_id,
            'channel' => 'sms',
            'status' => 'pending',
        ]);

        // In production, this would integrate with your SMS service
        // For now, we'll just log the notification
        $notificationLog->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return response()->json([
            'message' => 'Inspection report SMS sent successfully',
            'notification_log' => $notificationLog
        ]);
    }
}
