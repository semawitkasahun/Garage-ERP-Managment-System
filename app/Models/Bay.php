<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bay extends Model
{
    protected $table = 'bays';
    protected $primaryKey = 'bay_id';
    public $timestamps = false;

    protected $fillable = ['branch_id', 'name', 'bay_type', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function branch() { return $this->belongsTo(Branch::class, 'branch_id', 'branch_id'); }
    public function appointments() { return $this->hasMany(Appointment::class, 'bay_id', 'bay_id'); }
}