<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    /**
     * List all users (Admin/Owner only)
     */
    public function index(Request $request)
    {
        $user = auth()->user();

        // Only Admin and Owner can list users
        if (!$user->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized. Admin or Owner role required.'
            ], 403);
        }

        $query = User::query()->with(['employee', 'branch', 'roles']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('username', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('role')) {
            $query->whereHas('roles', function ($q) use ($request) {
                $q->where('name', $request->role);
            });
        }

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->latest()
            ->paginate($request->integer('per_page', 20));
    }

    /**
     * Create a new user (Admin/Owner only)
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized. Admin or Owner role required.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|string|email|max:100|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'first_name' => 'required|string|max:50',
            'last_name' => 'required|string|max:50',
            'branch_id' => 'required|integer|exists:branches,branch_id',
            'role_id' => 'required|integer|exists:roles,role_id',
            'job_title' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Create employee record
        $employee = Employee::create([
            'branch_id' => $request->branch_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'job_title' => $request->job_title ?? 'Employee',
            'employment_status' => 'active',
        ]);

        // Create user
        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password_hash' => Hash::make($request->password),
            'employee_id' => $employee->employee_id,
            'branch_id' => $request->branch_id,
            'is_active' => $request->boolean('is_active', true),
        ]);

        // Assign role
        $user->roles()->attach($request->role_id);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->load(['employee', 'branch', 'roles'])
        ], 201);
    }

    /**
     * Show a specific user
     */
    public function show(User $user)
    {
        $currentUser = auth()->user();

        // Only Admin/Owner can view other users
        if ($currentUser->user_id !== $user->user_id &&
            !$currentUser->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        return $user->load(['employee', 'branch', 'roles.permissions']);
    }

    /**
     * Update a user
     */
    public function update(Request $request, User $user)
    {
        $currentUser = auth()->user();

        // Only Admin/Owner can update other users
        if ($currentUser->user_id !== $user->user_id &&
            !$currentUser->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|required|string|max:50|unique:users,username,' . $user->user_id . ',user_id',
            'email' => 'sometimes|required|string|email|max:100|unique:users,email,' . $user->user_id . ',user_id',
            'first_name' => 'sometimes|required|string|max:50',
            'last_name' => 'sometimes|required|string|max:50',
            'branch_id' => 'sometimes|required|integer|exists:branches,branch_id',
            'job_title' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
            'role_id' => 'sometimes|integer|exists:roles,role_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update employee if needed
        if ($request->has('first_name') || $request->has('last_name') || $request->has('job_title')) {
            if ($user->employee) {
                $user->employee->update([
                    'first_name' => $request->first_name ?? $user->employee->first_name,
                    'last_name' => $request->last_name ?? $user->employee->last_name,
                    'job_title' => $request->job_title ?? $user->employee->job_title,
                ]);
            }
        }

        // Update user
        $user->update($request->only(['username', 'email', 'branch_id', 'is_active']));

        // Update role if provided
        if ($request->has('role_id')) {
            $user->roles()->sync([$request->role_id]);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load(['employee', 'branch', 'roles'])
        ]);
    }

    /**
     * Delete a user
     */
    public function destroy(User $user)
    {
        $currentUser = auth()->user();

        // Only Admin/Owner can delete users
        if (!$currentUser->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        // Prevent deleting yourself
        if ($currentUser->user_id === $user->user_id) {
            return response()->json([
                'message' => 'Cannot delete your own account'
            ], 422);
        }

        // Prevent deleting Owner
        if ($user->hasRole('Owner')) {
            return response()->json([
                'message' => 'Cannot delete Owner account'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Assign roles to a user
     */
    public function assignRoles(Request $request, User $user)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'role_ids' => 'required|array',
            'role_ids.*' => 'integer|exists:roles,role_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Prevent assigning Owner role to non-Owner
        $ownerRole = Role::where('name', 'Owner')->first();
        if ($ownerRole && in_array($ownerRole->role_id, $request->role_ids) && !$currentUser->hasRole('Owner')) {
            return response()->json([
                'message' => 'Only Owner can assign Owner role'
            ], 403);
        }

        $user->roles()->sync($request->role_ids);

        return response()->json([
            'message' => 'Roles assigned successfully',
            'user' => $user->load(['roles'])
        ]);
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        $currentUser = auth()->user();

        if (!$currentUser->hasAnyRole(['Admin', 'Owner'])) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }

        if ($currentUser->user_id === $user->user_id) {
            return response()->json([
                'message' => 'Cannot deactivate your own account'
            ], 422);
        }

        if ($user->hasRole('Owner') && !$currentUser->hasRole('Owner')) {
            return response()->json([
                'message' => 'Only Owner can deactivate Owner account'
            ], 403);
        }

        $user->update([
            'is_active' => !$user->is_active
        ]);

        return response()->json([
            'message' => 'User status updated',
            'is_active' => $user->is_active
        ]);
    }
}