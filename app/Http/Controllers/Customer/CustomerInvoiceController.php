<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Payment;

class CustomerInvoiceController extends Controller
{
    /**
     * Get all invoices for the logged-in customer
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $invoices = Invoice::where('customer_id', $customer->customer_id)
            ->with(['branch', 'items', 'payments'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    /**
     * Get a specific invoice
     */
    public function show(Request $request, $invoiceId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $invoice = Invoice::where('customer_id', $customer->customer_id)
            ->where('invoice_id', $invoiceId)
            ->with(['branch', 'items', 'payments', 'creditNotes'])
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $invoice,
        ]);
    }

    /**
     * Get unpaid invoices
     */
    public function unpaid(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $invoices = Invoice::where('customer_id', $customer->customer_id)
            ->whereIn('status', ['unpaid', 'partial'])
            ->with(['branch'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    /**
     * Get paid invoices
     */
    public function paid(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $invoices = Invoice::where('customer_id', $customer->customer_id)
            ->where('status', 'paid')
            ->with(['branch'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $invoices,
        ]);
    }

    /**
     * Make a payment (customer self-service)
     */
    public function pay(Request $request, $invoiceId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,card,mobile_money,bank_transfer',
            'reference_no' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $invoice = Invoice::where('customer_id', $customer->customer_id)
            ->where('invoice_id', $invoiceId)
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        }

        if ($invoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This invoice is already paid',
            ], 422);
        }

        $remaining = $invoice->total_amount - $invoice->amount_paid;
        if ($request->amount > $remaining) {
            return response()->json([
                'success' => false,
                'message' => 'Payment amount exceeds remaining balance',
                'remaining' => $remaining,
            ], 422);
        }

        // Create payment
        $payment = Payment::create([
            'invoice_id' => $invoice->invoice_id,
            'customer_id' => $customer->customer_id,
            'method' => $request->payment_method,
            'amount' => $request->amount,
            'reference_no' => $request->reference_no,
            'received_by' => null, // Customer self-payment
            'paid_at' => now(),
        ]);

        // Update invoice
        $invoice->amount_paid += $request->amount;
        if ($invoice->amount_paid >= $invoice->total_amount) {
            $invoice->status = 'paid';
        } else {
            $invoice->status = 'partial';
        }
        $invoice->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment successful!',
            'data' => [
                'payment' => $payment,
                'invoice' => $invoice,
            ],
        ]);
    }

    /**
     * Get invoice summary
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $invoices = Invoice::where('customer_id', $customer->customer_id);

        $summary = [
            'total_invoices' => $invoices->count(),
            'total_amount' => $invoices->sum('total_amount'),
            'total_paid' => $invoices->sum('amount_paid'),
            'total_due' => $invoices->sum('total_amount') - $invoices->sum('amount_paid'),
            'unpaid_count' => (clone $invoices)->where('status', 'unpaid')->count(),
            'partial_count' => (clone $invoices)->where('status', 'partial')->count(),
            'paid_count' => (clone $invoices)->where('status', 'paid')->count(),
            'overdue_count' => (clone $invoices)->whereIn('status', ['unpaid', 'partial'])
                ->where('due_date', '<', now())
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $summary,
        ]);
    }

    /**
     * Download invoice PDF
     */
    public function download(Request $request, $invoiceId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $invoice = Invoice::where('customer_id', $customer->customer_id)
            ->where('invoice_id', $invoiceId)
            ->with(['items', 'branch'])
            ->first();

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        }

        // TODO: Generate PDF
        // return PDF::download($invoice);

        return response()->json([
            'success' => true,
            'message' => 'PDF download coming soon',
            'data' => $invoice,
        ]);
    }
}