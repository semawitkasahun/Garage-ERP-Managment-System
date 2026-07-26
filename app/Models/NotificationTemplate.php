<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationTemplate extends Model
{
    use HasFactory;

    protected $table = 'notification_templates';
    protected $primaryKey = 'template_id';

    protected $fillable = [
        'name',
        'channel',
        'trigger_event',
        'subject',
        'body',
    ];

    // Relationships
    public function notificationLogs()
    {
        return $this->hasMany(NotificationLog::class, 'template_id');
    }
}