<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    use HasFactory;

    protected $table = 'notification_logs';
    protected $primaryKey = 'notification_id';

    protected $fillable = [
        'template_id',
        'recipient_type',
        'recipient_id',
        'channel',
        'status',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    // Relationships
    public function template()
    {
        return $this->belongsTo(NotificationTemplate::class, 'template_id', 'template_id');
    }
}