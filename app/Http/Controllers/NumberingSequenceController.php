<?php

namespace App\Http\Controllers;

use App\Models\NumberingSequence;
use Illuminate\Http\Request;

class NumberingSequenceController extends Controller
{
    public function index(Request $request)
    {
        return NumberingSequence::query()
            ->with(['branch'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|string|max:30',
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
            'prefix' => 'nullable|string|max:10',
            'next_number' => 'sometimes|integer|min:1',
        ]);

        $validated['next_number'] = $validated['next_number'] ?? 1;

        $sequence = NumberingSequence::create($validated);
        return response()->json($sequence, 201);
    }

    public function show(NumberingSequence $numberingSequence)
    {
        return $numberingSequence->load('branch');
    }

    public function update(Request $request, NumberingSequence $numberingSequence)
    {
        $validated = $request->validate([
            'prefix' => 'nullable|string|max:10',
            'next_number' => 'sometimes|integer|min:1',
        ]);

        $numberingSequence->update($validated);
        return $numberingSequence;
    }

    public function destroy(NumberingSequence $numberingSequence)
    {
        $numberingSequence->delete();
        return response()->noContent();
    }

    public function getNextNumber(Request $request)
    {
        $validated = $request->validate([
            'entity_type' => 'required|string|max:30',
            'branch_id' => 'nullable|integer|exists:branches,branch_id',
        ]);

        $sequence = NumberingSequence::where('entity_type', $validated['entity_type'])
            ->where('branch_id', $validated['branch_id'])
            ->first();// Find the sequence for the given entity type and branch

        if (!$sequence) {
            $sequence = NumberingSequence::create([
                'entity_type' => $validated['entity_type'],
                'branch_id' => $validated['branch_id'],
                'prefix' => strtoupper(substr($validated['entity_type'], 0, 3)) . '-',
                'next_number' => 1,
            ]);// Create a new sequence if it doesn't exist
        }

        $number = $sequence->next_number;
        $formatted = $sequence->prefix . date('Y') . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);

        $sequence->increment('next_number');

        return response()->json([
            'number' => $number,
            'formatted' => $formatted,
            'sequence' => $sequence,
        ]);
    }
}