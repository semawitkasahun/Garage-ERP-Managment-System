<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Quotation;

class CustomerQuotationController extends Controller
{
    /**
     * Get all quotations for the logged-in customer
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

        $quotations = Quotation::where('customer_id', $customer->customer_id)
            ->with(['vehicle', 'items', 'createdBy'])
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'success' => true,
            'data' => $quotations,
        ]);
    }

    /**
     * Get a specific quotation
     */
    public function show(Request $request, $quotationId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $quotation = Quotation::where('customer_id', $customer->customer_id)
            ->where('quotation_id', $quotationId)
            ->with(['vehicle', 'items', 'createdBy', 'inspection'])
            ->first();

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $quotation,
        ]);
    }

    /**
     * Get approved quotations (ready for service)
     */
    public function approved(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $quotations = Quotation::where('customer_id', $customer->customer_id)
            ->where('status', 'approved')
            ->with(['vehicle', 'items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $quotations,
        ]);
    }

    /**
     * Get pending quotations (awaiting customer approval)
     */
    public function pending(Request $request)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $quotations = Quotation::where('customer_id', $customer->customer_id)
            ->whereIn('status', ['draft', 'sent'])
            ->with(['vehicle', 'items'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $quotations,
        ]);
    }

    /**
     * Approve a quotation (customer acceptance)
     */
    public function approve(Request $request, $quotationId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $quotation = Quotation::where('customer_id', $customer->customer_id)
            ->where('quotation_id', $quotationId)
            ->first();

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation not found',
            ], 404);
        }

        if ($quotation->status !== 'sent') {
            return response()->json([
                'success' => false,
                'message' => 'This quotation cannot be approved',
            ], 422);
        }

        $quotation->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_via' => 'customer_portal',
        ]);

        // TODO: Create work order automatically?
        // WorkOrder::create([...]);

        return response()->json([
            'success' => true,
            'message' => 'Quotation approved successfully!',
            'data' => $quotation,
        ]);
    }

    /**
     * Reject a quotation
     */
    public function reject(Request $request, $quotationId)
    {
        $user = $request->user();
        $customer = Customer::where('email', $user->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Customer not found',
            ], 404);
        }

        $quotation = Quotation::where('customer_id', $customer->customer_id)
            ->where('quotation_id', $quotationId)
            ->first();

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation not found',
            ], 404);
        }

        if ($quotation->status !== 'sent') {
            return response()->json([
                'success' => false,
                'message' => 'This quotation cannot be rejected',
            ], 422);
        }

        $quotation->update([
            'status' => 'rejected',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Quotation rejected',
            'data' => $quotation,
        ]);
    }
}