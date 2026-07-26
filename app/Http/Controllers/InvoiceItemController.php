<?php

namespace App\Http\Controllers;

use App\Models\InvoiceItem;
use Illuminate\Http\Request;

class InvoiceItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InvoiceItem::query()->with(['invoice']);

        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|integer|exists:invoices,invoice_id',
            'description' => 'required|string|max:255',
            'quantity' => 'nullable|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'line_total' => 'required|numeric|min:0',
        ]);

        $item = InvoiceItem::create($validated);
        return response()->json($item, 201);
    }

    public function show(InvoiceItem $invoiceItem)
    {
        return $invoiceItem->load('invoice');
    }

    public function update(Request $request, InvoiceItem $invoiceItem)
    {
        $validated = $request->validate([
            'description' => 'nullable|string|max:255',
            'quantity' => 'nullable|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'line_total' => 'nullable|numeric|min:0',
        ]);

        $invoiceItem->update($validated);
        return $invoiceItem;
    }

    public function destroy(InvoiceItem $invoiceItem)
    {
        $invoiceItem->delete();
        return response()->noContent();
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|integer|exists:invoices,invoice_id',
            'items' => 'required|array',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'required|numeric|min:0',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['invoice_id'] = $validated['invoice_id'];
            $createdItems[] = InvoiceItem::create($itemData);
        }

        return response()->json($createdItems, 201);
    }

    public function getByInvoice($invoiceId)
    {
        $items = InvoiceItem::where('invoice_id', $invoiceId)->get();
        return $items;
    }
}