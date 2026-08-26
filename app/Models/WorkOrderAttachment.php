<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkOrderAttachment extends Model
{
    use HasFactory;

    protected $table = 'work_order_attachments';
    protected $primaryKey = 'attachment_id';

    protected $fillable = [
        'work_order_id',
        'job_card_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'description',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    // Relationships
    public function workOrder()
    {
        return $this->belongsTo(WorkOrder::class, 'work_order_id', 'work_order_id');
    }

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class, 'job_card_id', 'job_card_id');
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_id');
    }

    // Helper methods
    public function isImage()
    {
        return in_array($this->file_type, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    }

    public function isDocument()
    {
        return in_array($this->file_type, ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
    }

    public function getFileSizeInKB()
    {
        return round($this->file_size / 1024, 2);
    }

    public function getFileSizeInMB()
    {
        return round($this->file_size / (1024 * 1024), 2);
    }
}