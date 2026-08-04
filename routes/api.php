<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CustomerController;

// Dashboard Controllers
use App\Http\Controllers\Dashboard\OwnerDashboardController;
use App\Http\Controllers\Dashboard\HRDashboardController;
use App\Http\Controllers\Dashboard\TechnicianDashboardController;

// Customer Controllers
use App\Http\Controllers\Customer\CustomerDashboardController;
use App\Http\Controllers\Customer\CustomerVehicleController;
use App\Http\Controllers\Customer\CustomerAppointmentController;
use App\Http\Controllers\Customer\CustomerQuotationController;
use App\Http\Controllers\Customer\CustomerInvoiceController;
use App\Http\Controllers\Dashboard\ManagerDashboardController;

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\BayController;
use App\Http\Controllers\VehicleCheckinController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

/*
|--------------------------------------------------------------------------
| Public Routes (No Auth Required)
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

/*
|--------------------------------------------------------------------------
| Protected Routes (Authentication Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Staff Appointments & Bays
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::get('/bays', [BayController::class, 'index']);
    Route::get('/technicians', [AppointmentController::class, 'technicians']);
    // Vehicle Check-Ins
    Route::get('/checkins', [VehicleCheckinController::class, 'index']);
    Route::post('/checkins', [VehicleCheckinController::class, 'store']);
    Route::get('/checkins/form/{appointmentId}', [VehicleCheckinController::class, 'getCheckinForm']); // Must be before {vehicleCheckin}
    Route::get('/checkins/{vehicleCheckin}', [VehicleCheckinController::class, 'show']);
    Route::patch('/checkins/{vehicleCheckin}', [VehicleCheckinController::class, 'update']);
    Route::delete('/checkins/{vehicleCheckin}', [VehicleCheckinController::class, 'destroy']);
    Route::post('/checkins/{vehicleCheckin}/media', [VehicleCheckinController::class, 'uploadMedia']);
    Route::post('/checkins/{vehicleCheckin}/signature', [VehicleCheckinController::class, 'uploadSignature']);

    /*
    |--------------------------------------------------------------------------
    | Customer Creation Routes (Technician + Higher)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Technician,Service Advisor,Manager,Supervisor,Admin,Owner')
        ->prefix('customers')
        ->group(function () {
            Route::get('/', [CustomerController::class, 'index']);
            Route::post('/', [CustomerController::class, 'store']);
            Route::post('/{customer}/send-credentials', [CustomerController::class, 'sendCredentials']);
            Route::get('/search', [CustomerController::class, 'search']);
        });

    /*
    |--------------------------------------------------------------------------
    | Owner Dashboard
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Owner')->prefix('owner')->group(function () {
        Route::get('/dashboard', [OwnerDashboardController::class, 'index']);
        Route::get('/revenue-chart', [OwnerDashboardController::class, 'revenueChart']);
        Route::get('/kpis', [OwnerDashboardController::class, 'kpis']);
    });

    /*
    |--------------------------------------------------------------------------
    | HR Dashboard (Supervisor)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Supervisor')->prefix('hr')->group(function () {
        Route::get('/dashboard', [HRDashboardController::class, 'index']);
        Route::get('/attendance-overview', [HRDashboardController::class, 'attendanceOverview']);
        Route::get('/employee-performance', [HRDashboardController::class, 'employeePerformance']);
        Route::get('/payroll-stats', [HRDashboardController::class, 'payrollStats']);
    });

    /*
    |--------------------------------------------------------------------------
    | Technician Dashboard
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Technician')->prefix('technician')->group(function () {
        Route::get('/dashboard', [TechnicianDashboardController::class, 'index']);
        Route::get('/today-schedule', [TechnicianDashboardController::class, 'todaySchedule']);
        Route::get('/labor-summary', [TechnicianDashboardController::class, 'laborSummary']);
    });

    /*
    |--------------------------------------------------------------------------
    | Customer Dashboard (Customer role only)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Customer')->prefix('customer')->group(function () {
        Route::get('/dashboard', [CustomerDashboardController::class, 'index']);
        Route::get('/quick-stats', [CustomerDashboardController::class, 'quickStats']);
        Route::get('/vehicles', [CustomerVehicleController::class, 'index']);
        Route::get('/vehicles/{vehicleId}', [CustomerVehicleController::class, 'show']);
        Route::get('/vehicles/{vehicleId}/service-history', [CustomerVehicleController::class, 'serviceHistory']);
        Route::get('/vehicles/{vehicleId}/maintenance', [CustomerVehicleController::class, 'maintenanceSchedule']);

        Route::get('/appointments', [CustomerAppointmentController::class, 'index']);
        Route::get('/appointments/upcoming', [CustomerAppointmentController::class, 'upcoming']);
        Route::post('/appointments', [CustomerAppointmentController::class, 'store']);
        Route::get('/appointments/{appointmentId}', [CustomerAppointmentController::class, 'show']);
        Route::put('/appointments/{appointmentId}/cancel', [CustomerAppointmentController::class, 'cancel']);
        Route::put('/appointments/{appointmentId}/reschedule', [CustomerAppointmentController::class, 'reschedule']);
        Route::get('/appointments/available-slots', [CustomerAppointmentController::class, 'availableSlots']);

        Route::get('/quotations', [CustomerQuotationController::class, 'index']);
        Route::get('/quotations/approved', [CustomerQuotationController::class, 'approved']);
        Route::get('/quotations/pending', [CustomerQuotationController::class, 'pending']);
        Route::get('/quotations/{quotationId}', [CustomerQuotationController::class, 'show']);
        Route::post('/quotations/{quotationId}/approve', [CustomerQuotationController::class, 'approve']);
        Route::post('/quotations/{quotationId}/reject', [CustomerQuotationController::class, 'reject']);

        Route::get('/invoices', [CustomerInvoiceController::class, 'index']);
        Route::get('/invoices/unpaid', [CustomerInvoiceController::class, 'unpaid']);
        Route::get('/invoices/paid', [CustomerInvoiceController::class, 'paid']);
        Route::get('/invoices/summary', [CustomerInvoiceController::class, 'summary']);
        Route::get('/invoices/{invoiceId}', [CustomerInvoiceController::class, 'show']);
        Route::post('/invoices/{invoiceId}/pay', [CustomerInvoiceController::class, 'pay']);
        Route::get('/invoices/{invoiceId}/download', [CustomerInvoiceController::class, 'download']);
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Routes (User Management)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner')->prefix('admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/assign-roles', [UserController::class, 'assignRoles']);
        Route::post('/users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    });

    /*
    |--------------------------------------------------------------------------
    | Manager Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Manager,Owner')->prefix('manager')->group(function () {
        Route::get('/dashboard', [ManagerDashboardController::class, 'index']);
        Route::get('/reports', function () {
            return response()->json(['message' => 'Manager reports']);
        });
    });
});