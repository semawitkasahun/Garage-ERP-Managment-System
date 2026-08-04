<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\Branch;
use App\Models\ActivityLog;

class AdminDashboardController extends Controller
{
    /**
     * Admin Dashboard - System management overview
     * Accessible only by users with Admin role
     */
    public function index(Request $request)
    {
        $stats = [
            // System Overview
            'system_summary' => [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'inactive_users' => User::where('is_active', false)->count(),
                'total_roles' => Role::count(),
                'total_branches' => Branch::count(),
            ],

            // Recent Activity
            'recent_activity' => [
                'recent_logins' => User::whereNotNull('last_login_at')
                    ->orderBy('last_login_at', 'desc')
                    ->limit(5)
                    ->get(['user_id', 'username', 'email', 'last_login_at']),
                'recent_users' => User::with(['roles'])
                    ->latest()
                    ->limit(5)
                    ->get(),
            ],

            // User Statistics
            'user_stats' => [
                'by_role' => Role::withCount('users')
                    ->get(),
                'by_branch' => Branch::withCount('users')
                    ->get(),
            ],

            // Security
            'security' => [
                'total_audit_logs' => \App\Models\AuditLog::count(),
                'recent_audit_logs' => \App\Models\AuditLog::with(['user'])
                    ->latest()
                    ->limit(10)
                    ->get(),
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
            'user' => $request->user()->load(['employee', 'branch']),
            'role' => 'Admin',
        ]);
    }
}