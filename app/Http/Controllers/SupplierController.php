<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('contact_person', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'address' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:50',
            'lead_time_days' => 'nullable|integer|min:0',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier)
    {
        return $supplier->load([
            'priceLists' => function ($query) {
                $query->with(['items']);
            },
            'performanceScores',
            'contracts' => function ($query) {
                $query->with(['document']);
            },
            'purchaseOrders' => function ($query) {
                $query->latest()->limit(10);
            }
        ]);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:150',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|string|email|max:100',
            'address' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string|max:50',
            'lead_time_days' => 'nullable|integer|min:0',
        ]);

        $supplier->update($validated);
        return $supplier;
    }

    public function destroy(Supplier $supplier)
    {
        // Check if supplier has purchase orders
        if ($supplier->purchaseOrders()->exists()) {
            return response()->json([
                'message' => 'Cannot delete supplier with existing purchase orders'
            ], 422);
        }

        $supplier->delete();
        return response()->noContent();
    }

    public function getPerformanceSummary($id)
    {
        $supplier = Supplier::with(['performanceScores'])->findOrFail($id);
        
        $average = [
            'on_time_delivery' => $supplier->performanceScores->avg('on_time_delivery_pct'),
            'quality' => $supplier->performanceScores->avg('quality_score'),
            'pricing' => $supplier->performanceScores->avg('pricing_score'),
        ];

        return response()->json([
            'supplier' => $supplier,
            'average_scores' => $average,
        ]);
    }
}