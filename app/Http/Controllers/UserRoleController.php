<?php

namespace App\Http\Controllers;

use App\Models\UserRole;
use Illuminate\Http\Request;

class UserRoleController extends Controller
{
    public function index(Request $request)
    {
        return UserRole::query()
            ->with(['user', 'role'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,user_id',
            'role_id' => 'required|integer|exists:roles,role_id',
        ]);

        $userRole = UserRole::create($validated);
        return response()->json($userRole, 201);
    }

    public function show($user_id, $role_id)
    {
        $userRole = UserRole::where('user_id', $user_id)
            ->where('role_id', $role_id)
            ->firstOrFail();
        return $userRole->load(['user', 'role']);
    }

    public function destroy($user_id, $role_id)
    {
        UserRole::where('user_id', $user_id)
            ->where('role_id', $role_id)
            ->delete();
        return response()->noContent();
    }
}