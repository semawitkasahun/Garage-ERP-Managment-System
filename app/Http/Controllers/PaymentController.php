<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::query()->with(['invoice', 'customer', 'receivedBy']);

        if ($request->has('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('method')) {
            $query->where('method', $request->method);
        }

        if ($request->has('from_date')) {
            $query->whereDate('paid_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('paid_at', '<=', $request->to_date);
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|integer|exists:invoices,invoice_id',
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'method' => 'required|string|max:20',
            'amount' => 'required|numeric|min:0.01',
            'reference_no' => 'nullable|string|max:50',
            'received_by' => 'required|integer|exists:users,user_id',
        ]);

        $payment = Payment::create($validated);

        // Update invoice
        $invoice = Invoice::find($validated['invoice_id']);
        $invoice->increment('amount_paid', $validated['amount']);

        if ($invoice->amount_paid >= $invoice->total_amount) {
            $invoice->update(['status' => 'paid']);
        } else {
            $invoice->update(['status' => 'partial']);
        }

        return response()->json($payment, 201);
    }

    public function show(Payment $payment)
    {
        return $payment->load(['invoice', 'customer', 'receivedBy']);
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'reference_no' => 'nullable|string|max:50',
        ]);

        $payment->update($validated);
        return $payment;
    }

    public function destroy(Payment $payment)
    {
        // Revert invoice amount
        $invoice = $payment->invoice;
        $invoice->decrement('amount_paid', $payment->amount);

        if ($invoice->amount_paid == 0) {
            $invoice->update(['status' => 'unpaid']);
        }

        $payment->delete();
        return response()->noContent();
    }

    public function getByCustomer($customerId)
    {
        $payments = Payment::where('customer_id', $customerId)
            ->with(['invoice', 'receivedBy'])
            ->latest()
            ->get();
        return $payments;
    }

    public function getByInvoice($invoiceId)
    {
        $payments = Payment::where('invoice_id', $invoiceId)
            ->with(['receivedBy'])
            ->latest()
            ->get();
        return $payments;
    }

    public function getSummary()
    {
        $summary = [
            'total_payments' => Payment::count(),
            'total_amount' => Payment::sum('amount'),
            'by_method' => Payment::select('method', \DB::raw('count(*) as count'), \DB::raw('sum(amount) as total'))
                ->groupBy('method')
                ->get(),
            'today_total' => Payment::whereDate('paid_at', today())->sum('amount'),
            'this_month_total' => Payment::whereMonth('paid_at', now()->month)->sum('amount'),
        ];
        return $summary;
    }
}