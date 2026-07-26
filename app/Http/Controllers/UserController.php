<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        return User::query()
            ->with(['employee', 'branch', 'roles'])
            ->latest()
            ->paginate($request->integer('per_page', 20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|string|email|max:100|unique:users,email',
            'password' => 'required|string|min:8',
            'employee_id' => 'nullable|integer|exists:employees,employee_id',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'is_active' => 'sometimes|boolean',
        ]);

        $validated['password_hash'] = Hash::make($validated['password']);
        unset($validated['password']);

        $user = User::create($validated);
        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user->load([
            'employee',
            'branch',
            'roles',
            'documents',
            'auditLogs'
        ]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'username' => 'sometimes|required|string|max:50|unique:users,username,' . $user->user_id . ',user_id',
            'email' => 'sometimes|required|string|email|max:100|unique:users,email,' . $user->user_id . ',user_id',
            'password' => 'sometimes|string|min:8',
            'employee_id' => 'nullable|integer|exists:employees,employee_id',
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'is_active' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password_hash'] = Hash::make($validated['password']);
            unset($validated['password']);
        }

        $user->update($validated);
        return $user;
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->noContent();
    }

    public function assignRoles(Request $request, User $user)
    {
        $validated = $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'integer|exists:roles,role_id',
        ]);

        $user->roles()->sync($validated['role_ids']);
        return $user->load('roles');
    }
}