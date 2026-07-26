<?php

namespace App\Http\Controllers;

use App\Models\CreditNote;
use App\Models\Invoice;
use Illuminate\Http\Request;

class CreditNoteController extends Controller
{
    public function index(Request $request)
    {
        $query = CreditNote::query()->with(['invoice', 'createdBy']);

        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|integer|exists:invoices,invoice_id',
            'reason' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0.01|max:' . $request->invoice->total_amount,
            'created_by' => 'required|integer|exists:users,user_id',
        ]);

        $creditNote = CreditNote::create($validated);

        // Update invoice
        $invoice = Invoice::find($validated['invoice_id']);
        $invoice->decrement('total_amount', $validated['amount']);

        return response()->json($creditNote, 201);
    }

    public function show(CreditNote $creditNote)
    {
        return $creditNote->load(['invoice', 'createdBy']);
    }

    public function update(Request $request, CreditNote $creditNote)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $creditNote->update($validated);
        return $creditNote;
    }

    public function destroy(CreditNote $creditNote)
    {
        // Revert invoice
        $invoice = $creditNote->invoice;
        $invoice->increment('total_amount', $creditNote->amount);

        $creditNote->delete();
        return response()->noContent();
    }

    public function getByInvoice($invoiceId)
    {
        $creditNotes = CreditNote::where('invoice_id', $invoiceId)
            ->with(['createdBy'])
            ->get();
        return $creditNotes;
    }

    public function getSummary()
    {
        $summary = [
            'total_credit_notes' => CreditNote::count(),
            'total_amount' => CreditNote::sum('amount'),
            'this_month_total' => CreditNote::whereMonth('created_at', now()->month)->sum('amount'),
        ];
        return $summary;
    }
}