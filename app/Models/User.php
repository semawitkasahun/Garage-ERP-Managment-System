<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';
    protected $primaryKey = 'user_id';

    protected $fillable = [
        'username',
        'email',
        'password_hash',
        'employee_id',
        'branch_id',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'email_verified_at' => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_id', 'branch_id');
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'user_roles', 'user_id', 'role_id');
    }

    // Role Check Methods
    public function hasRole($role)
    {
        return $this->roles()->where('name', $role)->exists();
    }

    public function hasAnyRole($roles)
    {
        return $this->roles()->whereIn('name', (array) $roles)->exists();
    }

    public function hasAllRoles($roles)
    {
        return $this->roles()->whereIn('name', (array) $roles)->count() === count((array) $roles);
    }

    public function isOwner()
    {
        return $this->hasRole('Owner');
    }

    public function isAdmin()
    {
        return $this->hasRole('Admin') || $this->isOwner();
    }

    public function isSupervisor()
    {
        return $this->hasRole('Supervisor') || $this->isAdmin();
    }

    public function isManager()
    {
        return $this->hasAnyRole(['Manager', 'Supervisor', 'Admin', 'Owner']);
    }

    public function isEmployee()
    {
        return $this->hasAnyRole(['Employee', 'Technician', 'Service Advisor', 'Accountant', 'Parts Manager']);
    }

    // Get user level (lower number = higher权限)
    public function getRoleLevel()
    {
        $role = $this->roles()->orderBy('level', 'asc')->first();
        return $role ? $role->level : 999;
    }

    public function canManageUser($user)
    {
        // Can't manage yourself
        if ($this->user_id === $user->user_id) {
            return false;
        }

        // Owner can manage everyone
        if ($this->isOwner()) {
            return true;
        }

        // Admin can manage non-owners
        if ($this->isAdmin() && !$user->isOwner()) {
            return true;
        }

        // Supervisor can manage employees and lower
        if ($this->isSupervisor() && !$user->isAdmin() && !$user->isOwner()) {
            return true;
        }

        // Manager can manage employees
        if ($this->isManager() && $user->isEmployee()) {
            return true;
        }

        return false;
    }
}