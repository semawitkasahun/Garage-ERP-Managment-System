<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $table = 'branches';
    protected $primaryKey = 'branch_id';

    protected $fillable = [
        'name',
        'code',
        'address',
        'phone',
        'email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function employees()
    {
        return $this->hasMany(Employee::class, 'branch_id');
    }

    public function users()
    {
        return $this->hasMany(User::class, 'branch_id');
    }

    public function customers()
    {
        return $this->hasMany(Customer::class, 'branch_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'branch_id');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'branch_id');
    }

    public function inventoryStock()
    {
        return $this->hasMany(InventoryStock::class, 'branch_id');
    }

    public function bays()
    {
        return $this->hasMany(Bay::class, 'branch_id');
    }

    public function vehicleCheckins()
    {
        return $this->hasMany(VehicleCheckin::class, 'branch_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'branch_id');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'branch_id');
    }

    public function salesOrders()
    {
        return $this->hasMany(SalesOrder::class, 'branch_id');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class, 'branch_id');
    }

    public function assets()
    {
        return $this->hasMany(Asset::class, 'branch_id');
    }
}