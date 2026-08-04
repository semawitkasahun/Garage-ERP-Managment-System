<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Login user - Handles both staff and customers
     * Role determines which dashboard they see
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Attempt login
        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember_me'))) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = Auth::user();

        // Check if account is active
        if (!$user->is_active) {
            Auth::logout();
            return response()->json([
                'message' => 'Account is deactivated'
            ], 403);
        }

        // Regenerate session
        $request->session()->regenerate();

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Determine user type for frontend
        $userType = $this->getUserType($user);

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load(['employee', 'branch', 'roles']),
            'user_type' => $userType, // 'owner', 'admin', 'supervisor', 'technician', 'customer'
            'redirect' => $this->getRedirectRoute($userType),
        ]);
    }

    /**
     * Get authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['employee', 'branch', 'roles']);
        $userType = $this->getUserType($user);

        return response()->json([
            'user' => $user,
            'user_type' => $userType,
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password_hash)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $user->update([
            'password_hash' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password changed successfully'
        ]);
    }

    /**
     * Forgot password - send reset link
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Password reset link sent to your email'
            ]);
        }

        return response()->json([
            'message' => 'Unable to send reset link'
        ], 422);
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password_hash' => Hash::make($password)
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Password reset successfully'
            ]);
        }

        return response()->json([
            'message' => 'Invalid token or email'
        ], 422);
    }

    /**
     * Determine user type based on roles
     */
    private function getUserType($user)
    {
        $roles = $user->roles->pluck('name')->toArray();

        if (in_array('Owner', $roles)) return 'owner';
        if (in_array('Admin', $roles)) return 'admin';
        if (in_array('Supervisor', $roles)) return 'supervisor';
        if (in_array('Manager', $roles)) return 'manager';
        if (in_array('Finance', $roles)) return 'finance';
        if (in_array('HR', $roles)) return 'hr';
        if (in_array('Technician', $roles)) return 'technician';
        if (in_array('Service Advisor', $roles)) return 'service_advisor';
        if (in_array('Customer', $roles)) return 'customer';
        if (in_array('Viewer', $roles)) return 'viewer';

        return 'employee';
    }

    private function getRedirectRoute($userType)
    {
        $routes = [
            'owner' => '/owner/dashboard',
            'admin' => '/admin/dashboard',
            'supervisor' => '/hr/dashboard',
            'manager' => '/manager/dashboard',
            'finance' => '/finance/dashboard',
            'hr' => '/hr/dashboard',
            'technician' => '/technician/dashboard',
            'service_advisor' => '/service-advisor/dashboard',
            'customer' => '/customer/dashboard',
            'viewer' => '/dashboard',
            'employee' => '/dashboard',
        ];

        return $routes[$userType] ?? '/dashboard';
    }
}