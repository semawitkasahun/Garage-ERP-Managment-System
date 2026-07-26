<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bay extends Model
{
    use HasFactory;

    protected $table = 'bays';
    protected $primaryKey = 'bay_id';

    protected $fillable = [
        'branch_id',
        'name',
        'bay_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'bay_id');// Add this relationship to link appointments to the bay
    }
}