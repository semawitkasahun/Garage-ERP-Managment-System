<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SimpleSale extends Model
{
    use HasFactory;

    protected $table = 'simple_sales';
    protected $primaryKey = 'sale_id';
    public $incrementing = true;
    protected $keyType = 'int';

    protected $fillable = [
        'sale_number',
        'customer_id',
        'sale_date',
        'total_amount',
        'payment_status',
        'amount_paid',
        'discount',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'sale_date' => 'date',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    /**
     * Customer relationship
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'customer_id');
    }

    /**
     * Sale items
     */
    public function items(): HasMany
    {
        return $this->hasMany(SimpleSaleItem::class, 'sale_id', 'sale_id');
    }

    /**
     * Creator (user) relationship
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}
?>
