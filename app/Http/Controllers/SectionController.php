<?php

namespace App\Http\Controllers;

use App\Models\Section;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(Request $request)
    {
        $query = Section::query()->with(['branch', 'manager', 'employees']);

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('code', 'like', '%' . $search . '%');
            });
        }

        return $query->orderBy('sort_order')
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:20|unique:sections,code',
            'description' => 'nullable|string',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'manager_id' => 'nullable|integer|exists:employees,employee_id',
            'status' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $section = Section::create($validated);
        return response()->json($section, 201);
    }

    public function show(Section $section)
    {
        return $section->load([
            'branch',
            'manager',
            'employees',
            'workOrders',
            'inventoryItems'
        ]);
    }

    public function update(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'code' => 'sometimes|required|string|max:20|unique:sections,code,' . $section->section_id . ',section_id',
            'description' => 'nullable|string',
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'manager_id' => 'nullable|integer|exists:employees,employee_id',
            'status' => 'nullable|string|max:20',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $section->update($validated);
        return $section;
    }

    public function destroy(Section $section)
    {
        // Check if section has employees
        if ($section->employees()->exists()) {
            return response()->json([
                'message' => 'Cannot delete section with employees assigned'
            ], 422);
        }

        $section->delete();
        return response()->noContent();
    }

    public function getEmployees(Section $section)
    {
        return $section->employees()->with(['user'])->get();
    }

    public function getWorkOrders(Section $section)
    {
        return $section->workOrders()
            ->with(['customer', 'vehicle'])
            ->latest()
            ->get();
    }

    public function getInventoryItems(Section $section)
    {
        return $section->inventoryItems()
            ->with(['stock'])
            ->get();
    }

    public function getActive()
    {
        $sections = Section::where('status', 'active')
            ->with(['branch'])
            ->orderBy('sort_order')
            ->get();
        return $sections;
    }

    public function getByBranch($branchId)
    {
        $sections = Section::where('branch_id', $branchId)
            ->with(['manager', 'employees'])
            ->orderBy('sort_order')
            ->get();
        return $sections;
    }

    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'sections' => 'required|array',
            'sections.*.section_id' => 'required|integer|exists:sections,section_id',
            'sections.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['sections'] as $sectionData) {
            Section::where('section_id', $sectionData['section_id'])
                ->update(['sort_order' => $sectionData['sort_order']]);
        }

        return response()->json(['message' => 'Sections reordered successfully']);
    }

    public function getSummary($sectionId)
    {
        $section = Section::with(['employees', 'workOrders'])->findOrFail($sectionId);

        return response()->json([
            'section' => $section,
            'employee_count' => $section->employees()->count(),
            'work_order_count' => $section->workOrders()->count(),
            'active_work_orders' => $section->workOrders()->where('status', 'in_progress')->count(),
            'completed_work_orders' => $section->workOrders()->where('status', 'completed')->count(),
            'inventory_items' => $section->inventoryItems()->count(),
        ]);
    }
}