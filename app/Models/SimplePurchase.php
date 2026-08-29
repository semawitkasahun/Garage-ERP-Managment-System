<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SimplePurchase extends Model
{
    use HasFactory;

    protected $table = 'simple_purchases';
    protected $primaryKey = 'purchase_id';

    protected $fillable = [
        'purchase_number',
        'supplier_id',
        'purchase_date',
        'invoice_reference',
        'payment_status',
        'amount_paid',
        'total_amount',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'amount_paid' => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($purchase) {
            $latest = self::latest('purchase_id')->first();
            $num = $latest ? ((int) substr($latest->purchase_number, 4)) + 1 : 1;
            $purchase->purchase_number = 'PUR-' . str_pad($num, 5, '0', STR_PAD_LEFT);
        });
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(SimplePurchaseItem::class, 'purchase_id', 'purchase_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'user_id');
    }
}
