<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceAudit extends Model
{
    use HasFactory;

    protected $table = 'attendance_audit';
    protected $primaryKey = 'audit_id';

    protected $fillable = [
        'employee_id',
        'attendance_id',
        'action',
        'method',
        'branch_id',
        'qr_token_id',
        'ip_address',
        'user_agent',
        'notes',
        'metadata',
        'action_timestamp',
    ];

    protected $casts = [
        'action_timestamp' => 'datetime',
        'metadata' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function attendance()
    {
        return $this->belongsTo(Attendance::class, 'attendance_id', 'attendance_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function qrToken()
    {
        return $this->belongsTo(QrAttendanceToken::class, 'qr_token_id', 'token_id');
    }

    /**
     * Log an attendance action
     */
    public static function logAction($data)
    {
        return self::create([
            'employee_id' => $data['employee_id'] ?? null,
            'attendance_id' => $data['attendance_id'] ?? null,
            'action' => $data['action'],
            'method' => $data['method'] ?? null,
            'branch_id' => $data['branch_id'] ?? null,
            'qr_token_id' => $data['qr_token_id'] ?? null,
            'ip_address' => $data['ip_address'] ?? request()->ip(),
            'user_agent' => $data['user_agent'] ?? request()->userAgent(),
            'notes' => $data['notes'] ?? null,
            'metadata' => $data['metadata'] ?? null,
            'action_timestamp' => now(),
        ]);
    }
}
