<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class PermissionMiddleware
{
    public function handle(Request $request, Closure $next, $permission)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if (!$user->hasPermission($permission)) {
            return response()->json([
                'message' => 'Unauthorized. Required permission: ' . $permission
            ], 403);
        }

        return $next($request);
    }
}