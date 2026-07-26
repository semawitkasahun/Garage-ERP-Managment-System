<?php

namespace App\Http\Controllers;

use App\Models\QuotationItem;
use Illuminate\Http\Request;
use App\Models\Quotation;

class QuotationItemController extends Controller
{
    public function index(Request $request)
    {
        $query = QuotationItem::query()->with(['quotation', 'finding', 'inventoryItem']);

        if ($request->has('quotation_id')) {
            $query->where('quotation_id', $request->quotation_id);
        }

        if ($request->has('item_type')) {
            $query->where('item_type', $request->item_type);
        }

        if ($request->has('approval_status')) {
            $query->where('approval_status', $request->approval_status);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quotation_id' => 'required|integer|exists:quotations,quotation_id',
            'finding_id' => 'nullable|integer|exists:inspection_findings,finding_id',
            'item_type' => 'required|string|max:10',
            'inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
            'description' => 'required|string|max:255',
            'quantity' => 'nullable|numeric|min:0',
            'unit_price' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'line_total' => 'required|numeric|min:0',
            'approval_status' => 'nullable|string|max:20',
            'approved_via' => 'nullable|string|max:20',
            'approved_at' => 'nullable|date',
        ]);

        $item = QuotationItem::create($validated);

        // Update quotation totals
        $this->updateQuotationTotals($item->quotation_id);

        return response()->json($item, 201);
    }

    public function show(QuotationItem $quotationItem)
    {
        return $quotationItem->load([
            'quotation',
            'finding',
            'inventoryItem',
            'jobCardTasks'
        ]);
    }

    public function update(Request $request, QuotationItem $quotationItem)
    {
        $validated = $request->validate([
            'quantity' => 'nullable|numeric|min:0',
            'unit_price' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'line_total' => 'nullable|numeric|min:0',
            'approval_status' => 'nullable|string|max:20',
            'approved_via' => 'nullable|string|max:20',
            'approved_at' => 'nullable|date',
        ]);

        $quotationItem->update($validated);

        // Update quotation totals
        $this->updateQuotationTotals($quotationItem->quotation_id);

        return $quotationItem;
    }

    public function destroy(QuotationItem $quotationItem)
    {
        $quotationId = $quotationItem->quotation_id;
        $quotationItem->delete();

        // Update quotation totals
        $this->updateQuotationTotals($quotationId);

        return response()->noContent();
    }

    public function approve(QuotationItem $quotationItem)
    {
        $quotationItem->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
        ]);
        return $quotationItem;
    }

    public function reject(QuotationItem $quotationItem)
    {
        $quotationItem->update([
            'approval_status' => 'rejected',
            'approved_at' => now(),
        ]);
        return $quotationItem;
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'quotation_id' => 'required|integer|exists:quotations,quotation_id',
            'items' => 'required|array',
            'items.*.finding_id' => 'nullable|integer|exists:inspection_findings,finding_id',
            'items.*.item_type' => 'required|string|max:10',
            'items.*.inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'nullable|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.line_total' => 'required|numeric|min:0',
            'items.*.approval_status' => 'nullable|string|max:20',
        ]);

        $createdItems = [];
        foreach ($validated['items'] as $itemData) {
            $itemData['quotation_id'] = $validated['quotation_id'];
            $createdItems[] = QuotationItem::create($itemData);
        }

        // Update quotation totals
        $this->updateQuotationTotals($validated['quotation_id']);

        return response()->json($createdItems, 201);
    }

    private function updateQuotationTotals($quotationId)
    {
        $items = QuotationItem::where('quotation_id', $quotationId)->get();

        $subtotal = $items->sum('line_total');
        $tax = $items->sum('tax_amount');
        $discount = $items->sum('discount_amount');

        $quotation = Quotation::find($quotationId);
        $quotation->update([
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'discount_amount' => $discount,
            'total_amount' => ($subtotal + $tax) - $discount,
        ]);
    }

    public function getByQuotation($quotationId)
    {
        $items = QuotationItem::where('quotation_id', $quotationId)
            ->with(['finding', 'inventoryItem'])
            ->get();
        return $items;
    }

    public function getApprovedItems($quotationId)
    {
        $items = QuotationItem::where('quotation_id', $quotationId)
            ->where('approval_status', 'approved')
            ->with(['finding', 'inventoryItem'])
            ->get();
        return $items;
    }
}