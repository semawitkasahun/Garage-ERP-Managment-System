<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::query()->with(['customer', 'branch']);

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('from_date')) {
            $query->whereDate('invoice_date', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('invoice_date', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_no' => 'required|string|max:30|unique:invoices,invoice_no',
            'source_type' => 'required|string|max:20',
            'source_id' => 'required|integer',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'invoice_date' => 'nullable|date',
            'due_date' => 'nullable|date|after:invoice_date',
            'subtotal' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
        ]);

        $invoice = Invoice::create($validated);
        return response()->json($invoice, 201);
    }

    public function show(Invoice $invoice)
    {
        return $invoice->load([
            'customer',
            'branch',
            'items',
            'payments' => function ($query) {
                $query->with(['receivedBy']);
            },
            'creditNotes'
        ]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'due_date' => 'nullable|date|after:invoice_date',
            'discount_amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|max:20',
        ]);

        $invoice->update($validated);
        return $invoice;
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->status === 'paid') {
            return response()->json([
                'message' => 'Cannot delete paid invoice'
            ], 422);
        }

        $invoice->delete();
        return response()->noContent();
    }

    public function markAsPaid(Invoice $invoice)
    {
        $invoice->update([
            'status' => 'paid',
            'amount_paid' => $invoice->total_amount,
        ]);
        return $invoice;
    }

    public function getByCustomer($customerId)
    {
        $invoices = Invoice::where('customer_id', $customerId)
            ->with(['branch', 'items'])
            ->latest()
            ->get();
        return $invoices;
    }

    public function getUnpaid()
    {
        $invoices = Invoice::where('status', 'unpaid')
            ->orWhere('status', 'partial')
            ->with(['customer', 'branch'])
            ->latest()
            ->get();
        return $invoices;
    }

    public function getOverdue()
    {
        $invoices = Invoice::whereIn('status', ['unpaid', 'partial'])
            ->where('due_date', '<', now())
            ->with(['customer', 'branch'])
            ->latest()
            ->get();
        return $invoices;
    }

    public function getSummary()
    {
        $summary = [
            'total_invoices' => Invoice::count(),
            'by_status' => Invoice::select('status', \DB::raw('count(*) as count'))
                ->groupBy('status')
                ->get(),
            'total_amount' => Invoice::sum('total_amount'),
            'total_paid' => Invoice::sum('amount_paid'),
            'total_unpaid' => Invoice::sum(\DB::raw('total_amount - amount_paid')),
            'overdue_count' => Invoice::whereIn('status', ['unpaid', 'partial'])
                ->where('due_date', '<', now())
                ->count(),
        ];
        return $summary;
    }
}