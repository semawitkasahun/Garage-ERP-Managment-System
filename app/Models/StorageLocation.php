<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StorageLocation extends Model
{
  protected $fillable = ['name', 'parent_id', 'type', 'notes'];

  public function parent(): BelongsTo
  {
    return $this->belongsTo(StorageLocation::class, 'parent_id');
  }

  public function children(): HasMany
  {
    return $this->hasMany(StorageLocation::class, 'parent_id');
  }

  public function getFullPathAttribute(): string
  {
    $names = [$this->name];
    $node = $this->parent;
    while ($node) {
      $names[] = $node->name;
      $node = $node->parent;
    }

    return implode(' / ', array_reverse($names));
  }
}
