<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Equipment extends Model
{
    use HasFactory, SoftDeletes;

    public const CATEGORIES = [
        'Hand Tools',
        'Power Tools',
        'Diagnostic Equipment',
        'Electrical Equipment',
        'Lifting Equipment',
        'Workshop Equipment',
        'Safety Equipment',
        'Cleaning Equipment',
        'Other'
    ];

    public const STATUSES = [
        'Available',
        'Checked Out',
        'Under Maintenance',
        'Damaged',
        'Missing',
        'Retired'
    ];

    public const CONDITIONS = [
        'Excellent',
        'Good',
        'Fair',
        'Damaged',
        'N/A'
    ];

    protected $fillable = [
        'equipment_code',
        'name',
        'category',
        'brand',
        'model',
        'serial_number',
        'description',
        'qr_code',
        'checkout_qr_code',
        'current_location',
        'condition',
        'status',
        'assigned_employee_id',
        'purchase_date',
        'purchase_cost',
        'last_maintenance_date',
        'next_maintenance_due',
        'notes'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'purchase_cost' => 'decimal:2',
        'last_maintenance_date' => 'date',
        'next_maintenance_due' => 'date',
    ];

    protected static function booted(): void
    {
        static::creating(function (Equipment $equipment) {
            $equipment->equipment_code ??= static::generateEquipmentCode();
            $equipment->qr_code ??= static::generateQrToken();
            $equipment->checkout_qr_code ??= static::generateQrToken();
            $equipment->status ??= 'Available';
        });

        static::created(function (Equipment $equipment) {
            $equipment->logEvent(
                'registered',
                'Equipment Registered',
                "Registered into Master Equipment Registry with initial status: {$equipment->status}",
                auth()->user()?->name ?? 'Supervisor'
            );
            $equipment->logEvent(
                'qr_generated',
                'QR Code Generated',
                "Permanent Check-Out and Check-In QR identities generated ({$equipment->equipment_code})",
                auth()->user()?->name ?? 'System'
            );
        });
    }

    public static function generateEquipmentCode(): string
    {
        $maxNum = 0;
        $codes = static::withTrashed()->pluck('equipment_code');
        foreach ($codes as $code) {
            if (preg_match('/EQ-(\d+)/', $code, $matches)) {
                $num = (int)$matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }
        $nextNum = $maxNum + 1;
        return 'EQ-' . str_pad((string) $nextNum, 5, '0', STR_PAD_LEFT);
    }

    public static function generateQrToken(): string
    {
        do {
            $token = Str::upper(Str::random(10));
        } while (static::where('qr_code', $token)->orWhere('checkout_qr_code', $token)->exists());
        return $token;
    }

    public function logEvent(string $eventType, string $title, ?string $description = null, ?string $performedBy = null, ?array $metadata = null): EquipmentHistory
    {
        return $this->histories()->create([
            'event_type' => $eventType,
            'title' => $title,
            'description' => $description,
            'performed_by' => $performedBy ?? auth()->user()?->name ?? 'Supervisor',
            'metadata' => $metadata,
            'event_date' => now(),
        ]);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(EquipmentHistory::class)->orderByDesc('event_date')->orderByDesc('id');
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id', 'employee_id');
    }

    public function checkouts(): HasMany
    {
        return $this->hasMany(EquipmentCheckout::class)->latest('checked_out_at');
    }

    public function activeCheckout(): HasMany
    {
        return $this->checkouts()->whereNull('returned_at');
    }

    public function maintenanceLogs(): HasMany
    {
        return $this->hasMany(EquipmentMaintenanceLog::class)->orderByDesc('performed_at');
    }

    public function requests(): HasMany
    {
        return $this->hasMany(EquipmentRequest::class)->latest();
    }

    public function missingReports(): HasMany
    {
        return $this->hasMany(EquipmentMissingReport::class)->latest('reported_at');
    }

    public function transfers(): HasMany
    {
        return $this->hasMany(EquipmentTransfer::class)->latest('transferred_at');
    }

    public function getIsOverdueAttribute(): bool
    {
        $open = $this->relationLoaded('checkouts')
            ? $this->checkouts->firstWhere('returned_at', null)
            : $this->activeCheckout()->first();
        return $this->status === 'Checked Out' && $open && $open->due_at && $open->due_at->isPast();
    }
}