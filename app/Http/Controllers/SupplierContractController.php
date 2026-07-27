<?php

namespace App\Http\Controllers;

use App\Models\SupplierContract;
use Illuminate\Http\Request;

class SupplierContractController extends Controller
{
    public function index(Request $request)
    {
        $query = SupplierContract::query()->with(['supplier', 'document']);

        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->has('expiring_soon')) {
            $days = $request->integer('expiring_soon', 30);
            $query->where('end_date', '<=', now()->addDays($days))
                ->where('end_date', '>=', now());
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'document_id' => 'required|integer|exists:documents,document_id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $contract = SupplierContract::create($validated);
        return response()->json($contract, 201);
    }

    public function show(SupplierContract $supplierContract)
    {
        return $supplierContract->load(['supplier', 'document']);
    }

    public function update(Request $request, SupplierContract $supplierContract)
    {
        $validated = $request->validate([
            'document_id' => 'sometimes|required|integer|exists:documents,document_id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
        ]);

        $supplierContract->update($validated);
        return $supplierContract;
    }

    public function destroy(SupplierContract $supplierContract)
    {
        $supplierContract->delete();
        return response()->noContent();
    }

    public function getActive($supplierId)
    {
        $contracts = SupplierContract::where('supplier_id', $supplierId)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with(['document'])
            ->get();
        return $contracts;
    }

    public function getExpiringSoon($days = 30)
    {
        $contracts = SupplierContract::with(['supplier'])
            ->where('end_date', '<=', now()->addDays($days))
            ->where('end_date', '>=', now())
            ->orderBy('end_date', 'asc')
            ->get();
        return $contracts;
    }

    public function getExpired()
    {
        $contracts = SupplierContract::with(['supplier'])
            ->where('end_date', '<', now())
            ->orderBy('end_date', 'asc')
            ->get();
        return $contracts;
    }
}