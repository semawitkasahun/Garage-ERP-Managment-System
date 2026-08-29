<?php

namespace App\Http\Controllers;

use App\Models\SimplePurchase;
use App\Models\SimplePurchaseItem;
use App\Models\InventoryStock;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SimplePurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = SimplePurchase::query()->with(['supplier', 'items.inventoryItem', 'createdBy']);

        // Search by purchase number, supplier name, or item name
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                  ->orWhere('invoice_reference', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('items', function ($iq) use ($search) {
                      $iq->where('item_name', 'like', "%{$search}%");
                  });
            });
        }

        // Filters
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('purchase_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('purchase_date', '<=', $request->to_date);
        }

        // Sorting
        $sort = $request->input('sort', 'newest');
        switch ($sort) {
            case 'oldest':
                $query->orderBy('purchase_date', 'asc')->orderBy('purchase_id', 'asc');
                break;
            case 'highest_amount':
                $query->orderBy('total_amount', 'desc');
                break;
            case 'lowest_amount':
                $query->orderBy('total_amount', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('purchase_date', 'desc')->orderBy('purchase_id', 'desc');
                break;
        }

        return $query->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|integer|exists:suppliers,supplier_id',
            'purchase_date' => 'required|date',
            'invoice_reference' => 'nullable|string|max:100',
            'payment_status' => 'required|in:paid,partial,unpaid',
            'amount_paid' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.item_name' => 'required|string|max:150',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.inventory_item_id' => 'nullable|integer|exists:inventory_items,item_id',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            // Calculate total amount
            $totalAmount = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                $total = (float)$item['quantity'] * (float)$item['unit_price'];
                $totalAmount += $total;
                $itemsData[] = [
                    'item_name' => $item['item_name'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $total,
                    'inventory_item_id' => $item['inventory_item_id'] ?? null,
                ];
            }

            // Determine paid amount based on status
            $amountPaid = 0;
            if ($validated['payment_status'] === 'paid') {
                $amountPaid = $totalAmount;
            } elseif ($validated['payment_status'] === 'partial') {
                $amountPaid = (float)($validated['amount_paid'] ?? 0);
                if ($amountPaid >= $totalAmount) {
                    $validated['payment_status'] = 'paid';
                    $amountPaid = $totalAmount;
                } elseif ($amountPaid <= 0) {
                    $validated['payment_status'] = 'unpaid';
                    $amountPaid = 0;
                }
            }

            // Create purchase
            $purchase = SimplePurchase::create([
                'supplier_id' => $validated['supplier_id'],
                'purchase_date' => $validated['purchase_date'],
                'invoice_reference' => $validated['invoice_reference'] ?? null,
                'payment_status' => $validated['payment_status'],
                'amount_paid' => $amountPaid,
                'total_amount' => $totalAmount,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->user_id ?? null,
            ]);

            // Create purchase items
            foreach ($itemsData as $item) {
                $purchase->items()->create($item);
            }

            $this->recordCashBankTransaction($purchase);

            return response()->json($purchase->load(['supplier', 'items']), 201);
        });
    }

    public function show(SimplePurchase $purchase)
    {
        return $purchase->load(['supplier', 'items.inventoryItem', 'createdBy']);
    }

    public function update(Request $request, SimplePurchase $purchase)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string',
            'invoice_reference' => 'nullable|string|max:100',
        ]);

        $purchase->update($validated);
        return response()->json($purchase->load(['supplier', 'items']));
    }

    public function destroy(SimplePurchase $purchase)
    {
        // Do not allow deleting paid/partial purchases to prevent history deletion
        if ($purchase->payment_status !== 'unpaid') {
            return response()->json([
                'message' => 'Cannot delete a purchase that has been fully or partially paid.'
            ], 422);
        }

        $purchase->delete();
        return response()->noContent();
    }

    public function markAsPaid(SimplePurchase $purchase)
    {
        $purchase->update([
            'payment_status' => 'paid',
            'amount_paid' => $purchase->total_amount,
        ]);

        $this->recordCashBankTransaction($purchase);

        return response()->json($purchase->load(['supplier', 'items']));
    }

    public function updatePayment(Request $request, SimplePurchase $purchase)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0',
        ]);

        $amountPaid = (float)$validated['amount_paid'];
        $totalAmount = (float)$purchase->total_amount;

        $status = 'partial';
        if ($amountPaid >= $totalAmount) {
            $status = 'paid';
            $amountPaid = $totalAmount;
        } elseif ($amountPaid <= 0) {
            $status = 'unpaid';
            $amountPaid = 0;
        }

        $purchase->update([
            'payment_status' => $status,
            'amount_paid' => $amountPaid,
        ]);

        $this->recordCashBankTransaction($purchase);

        return response()->json($purchase->load(['supplier', 'items']));
    }

    public function addToInventory(Request $request, $itemId)
    {
        $purchaseItem = SimplePurchaseItem::findOrFail($itemId);

        if (!$purchaseItem->inventory_item_id) {
            return response()->json([
                'message' => 'This purchase item is not linked to any inventory item.'
            ], 420);
        }

        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,branch_id',
        ]);

        return DB::transaction(function () use ($purchaseItem, $validated) {
            $branchId = $validated['branch_id'];
            $qty = (float)$purchaseItem->quantity;

            // Get or create stock record
            $stock = InventoryStock::firstOrCreate(
                [
                    'item_id' => $purchaseItem->inventory_item_id,
                    'branch_id' => $branchId,
                ],
                [
                    'quantity_on_hand' => 0,
                    'quantity_reserved' => 0,
                ]
            );

            $prevQty = (float)$stock->quantity_on_hand;
            $stock->increment('quantity_on_hand', $qty);
            $newQty = $prevQty + $qty;

            // Log stock movement
            $stock->item->movements()->create([
                'transaction_number' => 'MOV-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT),
                'item_id' => $purchaseItem->inventory_item_id,
                'branch_id' => $branchId,
                'movement_type' => 'in',
                'quantity' => $qty,
                'previous_quantity' => $prevQty,
                'new_quantity' => $newQty,
                'reference_type' => 'simple_purchase',
                'reference_id' => $purchaseItem->purchase_id,
                'notes' => 'Received from Simple Purchase #' . $purchaseItem->purchase->purchase_number,
                'moved_by' => auth()->id(),
                'moved_at' => now(),
            ]);

            return response()->json([
                'message' => 'Successfully added ' . $qty . ' units of ' . $purchaseItem->item_name . ' to inventory.',
                'stock' => $stock,
            ]);
        });
    }

    public function summary()
    {
        $now = Carbon::now();

        // 1. Total suppliers
        $totalSuppliers = Supplier::count();

        // 2. Active suppliers
        $activeSuppliers = Supplier::where('status', 'active')->count();

        // 3. Purchases this month (count)
        $purchasesThisMonth = SimplePurchase::whereMonth('purchase_date', $now->month)
            ->whereYear('purchase_date', $now->year)
            ->count();

        // 4. Unpaid purchases (count of unpaid and partial)
        $unpaidPurchases = SimplePurchase::whereIn('payment_status', ['unpaid', 'partial'])->count();

        return response()->json([
            'total_suppliers' => $totalSuppliers,
            'active_suppliers' => $activeSuppliers,
            'purchases_this_month' => $purchasesThisMonth,
            'unpaid_purchases' => $unpaidPurchases,
        ]);
    }

    private function recordCashBankTransaction(SimplePurchase $purchase)
    {
        if ($purchase->amount_paid > 0) {
            $exists = \App\Models\CashBankTransaction::where('reference_type', 'simple_purchase')
                ->where('reference_id', $purchase->purchase_id)
                ->first();
            if ($exists) {
                $exists->update([
                    'amount' => $purchase->amount_paid,
                    'transaction_date' => $purchase->purchase_date ?? now()->toDateString(),
                ]);
            } else {
                \App\Models\CashBankTransaction::create([
                    'transaction_date' => $purchase->purchase_date ?? now()->toDateString(),
                    'description' => "Supplier payment: Purchase #" . $purchase->purchase_number,
                    'type' => 'withdrawal',
                    'account' => 'cash',
                    'amount' => $purchase->amount_paid,
                    'reference_type' => 'simple_purchase',
                    'reference_id' => $purchase->purchase_id,
                ]);
            }
        } else {
            \App\Models\CashBankTransaction::where('reference_type', 'simple_purchase')
                ->where('reference_id', $purchase->purchase_id)
                ->delete();
        }
    }
}
