<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        return Document::query()
            ->with(['uploadedBy'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|string|max:30',
            'entity_id' => 'required|integer',
            'doc_type' => 'nullable|string|max:50',
            'file' => 'required|file|max:10240', // 10MB max
            'uploaded_by' => 'required|integer|exists:users,user_id',
        ]);

        $filePath = $request->file('file')->store('documents', 'public');

        $document = Document::create([
            'entity_type' => $validated['entity_type'],
            'entity_id' => $validated['entity_id'],
            'doc_type' => $validated['doc_type'],
            'file_path' => $filePath,
            'uploaded_by' => $validated['uploaded_by'],
            'uploaded_at' => now(),
        ]);

        return response()->json($document, 201);
    }

    public function show(Document $document)
    {
        return $document->load('uploadedBy');
    }

    public function update(Request $request, Document $document)
    {
        $validated = $request->validate([
            'doc_type' => 'nullable|string|max:50',
            'file' => 'sometimes|file|max:10240',
        ]);

        if ($request->hasFile('file')) {
            // Delete old file
            Storage::disk('public')->delete($document->file_path);
            $validated['file_path'] = $request->file('file')->store('documents', 'public');
        }

        $document->update($validated);
        return $document;
    }

    public function destroy(Document $document)
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
        return response()->noContent();
    }
}