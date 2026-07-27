<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route
Route::get('/test', function () {
  return response()->json(['message' => 'API is working!']);
});

// Auth routes
Route::prefix('auth')->group(function () {
  Route::post('/login', [AuthController::class, 'login']);
  Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
  Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
  Route::post('/auth/logout', [AuthController::class, 'logout']);
  Route::get('/auth/me', [AuthController::class, 'me']);
  Route::post('/auth/change-password', [AuthController::class, 'changePassword']);

  // Admin routes
  Route::middleware('role:Admin')->prefix('admin')->group(function () {
    Route::apiResource('users', UserController::class);
    Route::post('/users/{user}/assign-roles', [UserController::class, 'assignRoles']);
    Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
  });

  Route::middleware('role:Admin,Manager')->prefix('manager')->group(function () {
    Route::get('/reports', function () {
      return response()->json(['message' => 'Manager reports']);
    });
  });
});