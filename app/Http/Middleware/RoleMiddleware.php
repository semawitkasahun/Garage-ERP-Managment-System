<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        // ✅ Owner has ALL access - check first
        if ($user->hasRole('Owner')) {
            return $next($request);
        }

        // ✅ Check if user has any of the required roles
        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        // ✅ Check for role hierarchy (Admin can access Manager routes)
        if (in_array('Admin', $roles) && $user->hasRole('Admin')) {
            return $next($request);
        }

        if (in_array('Manager', $roles) && ($user->hasRole('Admin') || $user->hasRole('Owner'))) {
            return $next($request);
        }

        return response()->json([
            'message' => 'Unauthorized. Required role: ' . implode(', ', $roles)
        ], 403);
    }
}