<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class QrAttendanceToken extends Model
{
    use HasFactory;

    protected $table = 'qr_attendance_tokens';
    protected $primaryKey = 'token_id';

    protected $fillable = [
        'token',
        'branch_id',
        'expires_at',
        'is_used',
        'used_at',
        'used_by_employee_id',
        'generator_ip',
        'generator_user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function usedByEmployee()
    {
        return $this->belongsTo(Employee::class, 'used_by_employee_id', 'employee_id');
    }

    /**
     * Generate a cryptographically secure token
     */
    public static function generateSecureToken()
    {
        return bin2hex(random_bytes(32)); // 64 character hex string
    }

    /**
     * Check if token is expired
     */
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if token is valid for use
     */
    public function isValid()
    {
        return !$this->is_used && !$this->isExpired();
    }

    /**
     * Mark token as used
     */
    public function markAsUsed($employeeId)
    {
        $this->update([
            'is_used' => true,
            'used_at' => now(),
            'used_by_employee_id' => $employeeId,
        ]);
    }

    /**
     * Create a new token for a branch
     */
    public static function createForBranch($branchId, $ip = null, $userAgent = null)
    {
        return self::create([
            'token' => self::generateSecureToken(),
            'branch_id' => $branchId,
            'expires_at' => now()->addSeconds(30), // 30 second expiration
            'generator_ip' => $ip,
            'generator_user_agent' => $userAgent,
        ]);
    }

    /**
     * Clean up expired tokens (run periodically)
     */
    public static function cleanupExpired()
    {
        return self::where('expires_at', '<', now()->subHours(1))->delete();
    }
}
