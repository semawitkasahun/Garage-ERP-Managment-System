<?php

namespace App\Http\Controllers;

use App\Models\CheckinMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CheckinMediaController extends Controller
{
    public function index(Request $request)
    {
        $query = CheckinMedia::query()->with(['checkin']);

        if ($request->has('checkin_id')) {
            $query->where('checkin_id', $request->checkin_id);
        }

        if ($request->has('media_type')) {
            $query->where('media_type', $request->media_type);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'checkin_id' => 'required|integer|exists:vehicle_checkins,checkin_id',
            'media_type' => 'nullable|string|max:10',
            'file' => 'required|file|max:20480', // 20MB max
        ]);

        $path = $request->file('file')->store(
            'checkin/' . $validated['checkin_id'] . '/' . date('Y/m/d'),
            'public'
        );

        $media = CheckinMedia::create([
            'checkin_id' => $validated['checkin_id'],
            'file_path' => $path,
            'media_type' => $validated['media_type'] ?? ($request->file('file')->getClientOriginalExtension() === 'mp4' ? 'video' : 'photo'),
            'captured_at' => now(),
        ]);

        return response()->json([
            'media' => $media,
            'url' => Storage::url($path),
        ], 201);
    }

    public function show(CheckinMedia $checkinMedia)
    {
        return $checkinMedia->load('checkin');
    }

    public function update(Request $request, CheckinMedia $checkinMedia)
    {
        $validated = $request->validate([
            'media_type' => 'nullable|string|max:10',
        ]);

        $checkinMedia->update($validated);
        return $checkinMedia;
    }

    public function destroy(CheckinMedia $checkinMedia)
    {
        // Delete file from storage
        Storage::disk('public')->delete($checkinMedia->file_path);
        
        $checkinMedia->delete();
        return response()->noContent();
    }

    public function getByCheckin($checkinId)
    {
        $media = CheckinMedia::where('checkin_id', $checkinId)
            ->orderBy('captured_at', 'asc')
            ->get();

        return $media->map(function ($item) {
            return [
                'id' => $item->media_id,
                'url' => Storage::url($item->file_path),
                'type' => $item->media_type,
                'captured_at' => $item->captured_at,
            ];
        });
    }

    public function bulkUpload(Request $request)
    {
        $validated = $request->validate([
            'checkin_id' => 'required|integer|exists:vehicle_checkins,checkin_id',
            'files' => 'required|array',
            'files.*' => 'file|max:20480',
        ]);

        $uploadedFiles = [];
        foreach ($request->file('files') as $file) {
            $path = $file->store(
                'checkin/' . $validated['checkin_id'] . '/' . date('Y/m/d'),
                'public'
            );

            $media = CheckinMedia::create([
                'checkin_id' => $validated['checkin_id'],
                'file_path' => $path,
                'media_type' => $file->getClientOriginalExtension() === 'mp4' ? 'video' : 'photo',
                'captured_at' => now(),
            ]);

            $uploadedFiles[] = [
                'media' => $media,
                'url' => Storage::url($path),
            ];
        }

        return response()->json($uploadedFiles, 201);
    }
}