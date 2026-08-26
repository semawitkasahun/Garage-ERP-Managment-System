<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NumberingSequence extends Model
{
    use HasFactory;

    protected $table = 'numbering_sequences';
    protected $primaryKey = 'sequence_id';

    protected $fillable = [
        'entity_type',
        'branch_id',
        'prefix',
        'next_number',
    ];

    // Relationships
    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    // Helper method to get next number
    public function getNextNumber()
    {
        $prefix = $this->prefix ?? 'WO';
        $nextNumber = $this->next_number ?? 1;
        $formattedNumber = $prefix . '-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
        
        // Increment for next time
        $this->increment('next_number');
        
        return $formattedNumber;
    }
}