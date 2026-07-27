<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use HasFactory;

    protected $table = 'sections';
    protected $primaryKey = 'section_id';

    protected $fillable = [
        'name',
        'code',
        'description',
        'branch_id',
        'manager_id',
        'status',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function manager()
    {
        return $this->belongsTo(Employee::class, 'manager_id', 'employee_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'section_id');
    }

    public function workOrders()
    {
        return $this->hasMany(WorkOrder::class, 'section_id');
    }

    public function inventoryItems()
    {
        return $this->hasMany(InventoryItem::class, 'section_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}