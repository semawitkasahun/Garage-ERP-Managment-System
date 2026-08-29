<?php

namespace App\Http\Controllers;

use App\Models\SimpleSale;
use App\Models\SimpleSaleItem;
use App\Models\Customer;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SimpleSaleController extends Controller
{
    public function index(Request $request)
    {
        $query = SimpleSale::query()->with(['customer', 'items.inventoryItem', 'createdBy']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('sale_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($sq) use ($search) {
                      $sq->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%");
                  })
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }
        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->filled('from_date')) {
            $query->whereDate('sale_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('sale_date', '<=', $request->to_date);
        }

        $sort = $request->input('sort', 'newest');
        switch ($sort) {
            case 'oldest':
                $query->orderBy('sale_date', 'asc')->orderBy('sale_id', 'asc');
                break;
            case 'highest_amount':
                $query->orderBy('total_amount', 'desc');
                break;
            case 'lowest_amount':
                $query->orderBy('total_amount', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('sale_date', 'desc')->orderBy('sale_id', 'desc');
                break;
        }

        return $query->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|integer|exists:customers,customer_id',
            'sale_date' => 'required|date',
            'payment_status' => 'required|in:paid,partial,unpaid',
            'amount_paid' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:150',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
        ]);

        return DB::transaction(function () use ($validated) {
            // Compute totals
            $subtotal = 0;
            $itemsData = [];
            foreach ($validated['items'] as $item) {
                $total = (float) $item['quantity'] * (float) $item['unit_price'];
                $subtotal += $total;
                $itemsData[] = [
                    'item_name' => $item['item_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $total,
                    'inventory_item_id' => $item['inventory_item_id'] ?? null,
                ];
            }
            $discount = $validated['discount'] ?? 0;
            $totalAmount = max(0, $subtotal - $discount);

            // Adjust payment amount based on status
            $amountPaid = 0;
            if ($validated['payment_status'] === 'paid') {
                $amountPaid = $totalAmount;
            } elseif ($validated['payment_status'] === 'partial') {
                $amountPaid = (float) ($validated['amount_paid'] ?? 0);
                if ($amountPaid >= $totalAmount) {
                    $validated['payment_status'] = 'paid';
                    $amountPaid = $totalAmount;
                } elseif ($amountPaid <= 0) {
                    $validated['payment_status'] = 'unpaid';
                    $amountPaid = 0;
                }
            }

            $sale = SimpleSale::create([
                'sale_number' => 'SL-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'customer_id' => $validated['customer_id'],
                'sale_date' => $validated['sale_date'],
                'total_amount' => $totalAmount,
                'discount' => $discount,
                'payment_status' => $validated['payment_status'],
                'amount_paid' => $amountPaid,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->user_id ?? null,
            ]);

            foreach ($itemsData as $item) {
                $sale->items()->create($item);
            }

            // Reduce inventory stock for each linked inventory item
            foreach ($itemsData as $item) {
                if (!empty($item['inventory_item_id'])) {
                    $stock = InventoryStock::where('item_id', $item['inventory_item_id'])->first();
                    if ($stock) {
                        if ($stock->quantity_on_hand < $item['quantity']) {
                            throw new \Exception('Insufficient stock for item ID ' . $item['inventory_item_id']);
                        }
                        $stock->decrement('quantity_on_hand', $item['quantity']);
                    }
                }
            }

            $this->recordCashBankTransaction($sale);

            return response()->json($sale->load(['customer', 'items.inventoryItem']), 201);
        });
    }

    public function show(SimpleSale $sale)
    {
        return $sale->load(['customer', 'items.inventoryItem', 'createdBy']);
    }

    public function update(Request $request, SimpleSale $sale)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'discount' => 'nullable|numeric|min:0',
        ]);
        $sale->update($validated);
        return response()->json($sale->load(['customer', 'items']));
    }

    public function destroy(SimpleSale $sale)
    {
        if ($sale->payment_status !== 'unpaid') {
            return response()->json(['message' => 'Cannot delete a sale that has been paid or partially paid.'], 422);
        }
        $sale->delete();
        return response()->noContent();
    }

    public function markAsPaid(SimpleSale $sale)
    {
        $sale->update([
            'payment_status' => 'paid',
            'amount_paid' => $sale->total_amount,
        ]);
        $this->recordCashBankTransaction($sale);
        return response()->json($sale->load(['customer', 'items']));
    }

    public function updatePayment(Request $request, SimpleSale $sale)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
        ]);
        $amountPaid = (float) $validated['amount_paid'];
        $total = (float) $sale->total_amount;
        $status = 'partial';
        if ($amountPaid >= $total) {
            $status = 'paid';
            $amountPaid = $total;
        } elseif ($amountPaid <= 0) {
            $status = 'unpaid';
            $amountPaid = 0;
        }
        $sale->update([
            'payment_status' => $status,
            'amount_paid' => $amountPaid,
        ]);
        $this->recordCashBankTransaction($sale);
        return response()->json($sale->load(['customer', 'items']));
    }

    public function summary()
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $salesToday = SimpleSale::whereDate('sale_date', $today)->count();
        $salesThisMonth = SimpleSale::whereMonth('sale_date', $now->month)
            ->whereYear('sale_date', $now->year)
            ->count();
        $unpaid = SimpleSale::whereIn('payment_status', ['unpaid', 'partial'])->count();
        $totalSales = SimpleSale::sum('total_amount');
        return response()->json([
            'sales_today' => $salesToday,
            'sales_this_month' => $salesThisMonth,
            'unpaid_sales' => $unpaid,
            'total_sales' => $totalSales,
        ]);
    }

    private function recordCashBankTransaction(SimpleSale $sale)
    {
        if ($sale->amount_paid > 0) {
            $exists = \App\Models\CashBankTransaction::where('reference_type', 'simple_sale')
                ->where('reference_id', $sale->sale_id)
                ->first();
            if ($exists) {
                $exists->update([
                    'amount' => $sale->amount_paid,
                    'transaction_date' => $sale->sale_date ?? now()->toDateString(),
                ]);
            } else {
                \App\Models\CashBankTransaction::create([
                    'transaction_date' => $sale->sale_date ?? now()->toDateString(),
                    'description' => "Customer payment: Sale #" . $sale->sale_number,
                    'type' => 'deposit',
                    'account' => 'cash',
                    'amount' => $sale->amount_paid,
                    'reference_type' => 'simple_sale',
                    'reference_id' => $sale->sale_id,
                ]);
            }
        } else {
            \App\Models\CashBankTransaction::where('reference_type', 'simple_sale')
                ->where('reference_id', $sale->sale_id)
                ->delete();
        }
    }
}
?>
