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
use App\Http\Controllers\LeadController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\QrAttendanceController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\PayrollPeriodController;
use App\Http\Controllers\SalaryStructureController;
use App\Http\Controllers\AllowanceController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\PayrollRunController;
use App\Http\Controllers\PayrollItemController;
use App\Http\Controllers\EmployeeSalaryStructureController;
use App\Http\Controllers\PayrollReportController;
use App\Http\Controllers\EmployeePayrollWorkflowController;

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
        Route::get('/stats', [CustomerController::class, 'stats']);
        Route::get('/search', [CustomerController::class, 'search']);
        Route::get('/{customer}', [CustomerController::class, 'show']);
        Route::patch('/{customer}', [CustomerController::class, 'update']);
        Route::delete('/{customer}', [CustomerController::class, 'destroy']);
        Route::post('/{customer}/send-credentials', [CustomerController::class, 'sendCredentials']);
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
    Route::middleware('role:Service Advisor,Manager,Supervisor,Admin,Owner')
    ->prefix('leads')
    ->group(function () {
        Route::get('/', [LeadController::class, 'index']);
        Route::post('/', [LeadController::class, 'store']);
        Route::get('/stats', [LeadController::class, 'stats']);
        Route::get('/{lead}', [LeadController::class, 'show']);
        Route::patch('/{lead}', [LeadController::class, 'update']);
        Route::delete('/{lead}', [LeadController::class, 'destroy']);
        Route::post('/{lead}/followups', [LeadController::class, 'addFollowup']);
        Route::post('/{lead}/convert', [LeadController::class, 'convertToCustomer']);
        Route::patch('/{lead}/mark-lost', [LeadController::class, 'markLost']);
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
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('employees')
    ->group(function () {
        Route::get('/', [EmployeeController::class, 'index']);
        Route::post('/', [EmployeeController::class, 'store']);
        Route::get('/stats', [EmployeeController::class, 'stats']);
        Route::get('/payroll-profiles', [EmployeeController::class, 'getPayrollProfiles']);
        Route::get('/{employee}', [EmployeeController::class, 'show']);
        Route::patch('/{employee}', [EmployeeController::class, 'update']);
        Route::delete('/{employee}', [EmployeeController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Attendance Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('attendance')
    ->group(function () {
        Route::get('/', [AttendanceController::class, 'index']);
        Route::post('/', [AttendanceController::class, 'store']);
        Route::get('/stats', [AttendanceController::class, 'getStats']);
        Route::get('/summary', [AttendanceController::class, 'getSummary']);
        Route::get('/today', [AttendanceController::class, 'getToday']);
        Route::get('/employee/{employeeId}', [AttendanceController::class, 'getByEmployee']);
        Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/clock-out', [AttendanceController::class, 'clockOut']);
        Route::get('/{attendance}', [AttendanceController::class, 'show']);
        Route::patch('/{attendance}', [AttendanceController::class, 'update']);
        Route::delete('/{attendance}', [AttendanceController::class, 'destroy']);
        Route::post('/manual-correction', [AttendanceController::class, 'manualCorrection']);
        Route::get('/{attendance}/corrections', [AttendanceController::class, 'getCorrections']);
    });

    /*
    |--------------------------------------------------------------------------
    | Shift Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('shifts')
    ->group(function () {
        Route::get('/', [ShiftController::class, 'index']);
        Route::post('/', [ShiftController::class, 'store']);
        Route::get('/{shift}', [ShiftController::class, 'show']);
        Route::patch('/{shift}', [ShiftController::class, 'update']);
        Route::delete('/{shift}', [ShiftController::class, 'destroy']);
        Route::post('/{shift}/employees', [ShiftController::class, 'assignEmployee']);
        Route::delete('/{shift}/employees/{employeeId}', [ShiftController::class, 'removeEmployee']);
        Route::get('/{shift}/employees', [ShiftController::class, 'getEmployees']);
    });

    /*
    |--------------------------------------------------------------------------
    | Department Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('departments')
    ->group(function () {
        Route::get('/', [DepartmentController::class, 'index']);
        Route::post('/', [DepartmentController::class, 'store']);
        Route::get('/{department}', [DepartmentController::class, 'show']);
        Route::patch('/{department}', [DepartmentController::class, 'update']);
        Route::delete('/{department}', [DepartmentController::class, 'destroy']);
        Route::get('/{department}/employees', [DepartmentController::class, 'getEmployees']);
        Route::get('/{department}/shifts', [DepartmentController::class, 'getShifts']);
    });

    /*
    |--------------------------------------------------------------------------
    | Leave Request Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('leave-requests')
    ->group(function () {
        Route::get('/', [LeaveRequestController::class, 'index']);
        Route::get('/stats', [LeaveRequestController::class, 'getStats']);
        Route::get('/today', [LeaveRequestController::class, 'getTodayLeave']);
        Route::get('/pending', [LeaveRequestController::class, 'getPending']);
        Route::get('/approved', [LeaveRequestController::class, 'getApproved']);
        Route::post('/', [LeaveRequestController::class, 'store']);
        Route::get('/{leaveRequest}', [LeaveRequestController::class, 'show']);
        Route::patch('/{leaveRequest}', [LeaveRequestController::class, 'update']);
        Route::delete('/{leaveRequest}', [LeaveRequestController::class, 'destroy']);
        Route::post('/{leaveRequest}/approve', [LeaveRequestController::class, 'approve']);
        Route::post('/{leaveRequest}/reject', [LeaveRequestController::class, 'reject']);
        Route::get('/employee/{employeeId}', [LeaveRequestController::class, 'getByEmployee']);
    });

    /*
    |--------------------------------------------------------------------------
    | Payroll Run Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('payroll-runs')
    ->group(function () {
        Route::get('/', [PayrollRunController::class, 'index']);
        Route::get('/summary', [PayrollRunController::class, 'getSummary']);
        Route::get('/pending', [PayrollRunController::class, 'getPending']);
        Route::get('/branch/{branchId}', [PayrollRunController::class, 'getByBranch']);
        Route::get('/period/{payrollPeriodId}', [PayrollRunController::class, 'getByPayrollPeriod']);
        Route::post('/', [PayrollRunController::class, 'store']);
        Route::get('/{payrollRun}', [PayrollRunController::class, 'show']);
        Route::patch('/{payrollRun}', [PayrollRunController::class, 'update']);
        Route::delete('/{payrollRun}', [PayrollRunController::class, 'destroy']);
        Route::post('/{payrollRun}/process', [PayrollRunController::class, 'process']);
        Route::post('/{payrollRun}/calculate', [PayrollRunController::class, 'calculate']);
        Route::post('/{payrollRun}/approve', [PayrollRunController::class, 'approve']);
        Route::post('/{payrollRun}/mark-paid', [PayrollRunController::class, 'markAsPaid']);
    });

    /*
    |--------------------------------------------------------------------------
    | Payroll Item Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('payroll-items')
    ->group(function () {
        Route::get('/', [PayrollItemController::class, 'index']);
        Route::get('/run/{payrollRunId}', [PayrollItemController::class, 'getByPayrollRun']);
        Route::get('/employee/{employeeId}', [PayrollItemController::class, 'getByEmployee']);
        Route::get('/summary/{payrollRunId}', [PayrollItemController::class, 'getSummary']);
        Route::post('/', [PayrollItemController::class, 'store']);
        Route::post('/bulk', [PayrollItemController::class, 'bulkStore']);
        Route::get('/{payrollItem}', [PayrollItemController::class, 'show']);
        Route::patch('/{payrollItem}', [PayrollItemController::class, 'update']);
        Route::delete('/{payrollItem}', [PayrollItemController::class, 'destroy']);
        Route::post('/{payrollItem}/allowances', [PayrollItemController::class, 'addAllowance']);
        Route::post('/{payrollItem}/deductions', [PayrollItemController::class, 'addDeduction']);
        Route::delete('/{payrollItem}/allowances/{allowanceId}', [PayrollItemController::class, 'removeAllowance']);
        Route::delete('/{payrollItem}/deductions/{deductionId}', [PayrollItemController::class, 'removeDeduction']);
        Route::post('/{payrollItem}/generate-payslip', [PayrollItemController::class, 'generatePayslip']);
        Route::get('/{payrollItem}/download-payslip', [PayrollItemController::class, 'downloadPayslip']);
    });

    /*
    |--------------------------------------------------------------------------
    | Employee Salary Structure Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('employee-salary-structures')
    ->group(function () {
        Route::get('/', [EmployeeSalaryStructureController::class, 'index']);
        Route::get('/employee/{employeeId}/current', [EmployeeSalaryStructureController::class, 'getCurrent']);
        Route::get('/employee/{employeeId}/history', [EmployeeSalaryStructureController::class, 'getHistory']);
        Route::post('/', [EmployeeSalaryStructureController::class, 'store']);
        Route::get('/{employeeSalaryStructure}', [EmployeeSalaryStructureController::class, 'show']);
        Route::patch('/{employeeSalaryStructure}', [EmployeeSalaryStructureController::class, 'update']);
        Route::delete('/{employeeSalaryStructure}', [EmployeeSalaryStructureController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Payroll Period Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager,Finance')
    ->prefix('payroll-periods')
    ->group(function () {
        Route::get('/', [PayrollPeriodController::class, 'index']);
        Route::get('/summary', [PayrollPeriodController::class, 'getSummary']);
        Route::get('/dashboard-metrics', [PayrollPeriodController::class, 'getDashboardMetrics']);
        Route::get('/month-stats', [PayrollPeriodController::class, 'getMonthStats']);
        Route::get('/branch/{branchId}', [PayrollPeriodController::class, 'getByBranch']);
        Route::post('/', [PayrollPeriodController::class, 'store']);
        Route::get('/{payrollPeriod}', [PayrollPeriodController::class, 'show']);
        Route::patch('/{payrollPeriod}', [PayrollPeriodController::class, 'update']);
        Route::delete('/{payrollPeriod}', [PayrollPeriodController::class, 'destroy']);
        Route::post('/{payrollPeriod}/process', [PayrollPeriodController::class, 'process']);
        Route::post('/{payrollPeriod}/submit-approval', [PayrollPeriodController::class, 'submitForApproval']);
        Route::post('/{payrollPeriod}/approve', [PayrollPeriodController::class, 'approve']);
        Route::post('/{payrollPeriod}/mark-paid', [PayrollPeriodController::class, 'markAsPaid']);
        Route::post('/{payrollPeriod}/cancel', [PayrollPeriodController::class, 'cancel']);
        Route::post('/{payrollPeriod}/generate-payslips', [PayrollPeriodController::class, 'generatePayslips']);
        // Workflow Steps
        Route::post('/{payrollPeriod}/import-attendance', [PayrollPeriodController::class, 'importAttendance']);
        Route::post('/{payrollPeriod}/calculate-salaries', [PayrollPeriodController::class, 'calculateSalaries']);
        Route::post('/{payrollPeriod}/calculate-deductions', [PayrollPeriodController::class, 'calculateDeductions']);
        Route::post('/{payrollPeriod}/review', [PayrollPeriodController::class, 'reviewPayroll']);
        Route::post('/{payrollPeriod}/process-payment', [PayrollPeriodController::class, 'processPayment']);
    });

    /*
    |--------------------------------------------------------------------------
    | Employee Payroll Workflow Routes (Per-Employee)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager,Finance')
    ->prefix('employee-payroll')
    ->group(function () {
        Route::get('/list', [EmployeePayrollWorkflowController::class, 'list']);
        Route::get('/{employeeId}/detail', [EmployeePayrollWorkflowController::class, 'detail']);
        Route::get('/{employeeId}/attendance', [EmployeePayrollWorkflowController::class, 'attendance']);
        Route::post('/{employeeId}/calculate', [EmployeePayrollWorkflowController::class, 'calculate']);
        Route::post('/{employeeId}/calculate-deductions', [EmployeePayrollWorkflowController::class, 'calculateDeductions']);
        Route::post('/{employeeId}/confirm-review', [EmployeePayrollWorkflowController::class, 'confirmReview']);
        Route::post('/{employeeId}/approve', [EmployeePayrollWorkflowController::class, 'approve']);
        Route::post('/{employeeId}/pay', [EmployeePayrollWorkflowController::class, 'pay']);
        Route::get('/{employeeId}/payslip', [EmployeePayrollWorkflowController::class, 'payslip']);
        Route::get('/{employeeId}/receipt', [EmployeePayrollWorkflowController::class, 'receipt']);
    });

    /*
    |--------------------------------------------------------------------------
    | Salary Structure Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('salary-structures')
    ->group(function () {
        Route::get('/', [SalaryStructureController::class, 'index']);
        Route::get('/active', [SalaryStructureController::class, 'getActive']);
        Route::get('/department/{departmentId}', [SalaryStructureController::class, 'getByDepartment']);
        Route::post('/', [SalaryStructureController::class, 'store']);
        Route::get('/{salaryStructure}', [SalaryStructureController::class, 'show']);
        Route::patch('/{salaryStructure}', [SalaryStructureController::class, 'update']);
        Route::delete('/{salaryStructure}', [SalaryStructureController::class, 'destroy']);
        Route::post('/{salaryStructure}/assign-employee', [SalaryStructureController::class, 'assignToEmployee']);
    });

    /*
    |--------------------------------------------------------------------------
    | Allowance Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('allowances')
    ->group(function () {
        Route::get('/', [AllowanceController::class, 'index']);
        Route::get('/active', [AllowanceController::class, 'getActive']);
        Route::get('/taxable', [AllowanceController::class, 'getTaxable']);
        Route::get('/non-taxable', [AllowanceController::class, 'getNonTaxable']);
        Route::post('/', [AllowanceController::class, 'store']);
        Route::get('/{allowance}', [AllowanceController::class, 'show']);
        Route::patch('/{allowance}', [AllowanceController::class, 'update']);
        Route::delete('/{allowance}', [AllowanceController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Deduction Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager')
    ->prefix('deductions')
    ->group(function () {
        Route::get('/', [DeductionController::class, 'index']);
        Route::get('/active', [DeductionController::class, 'getActive']);
        Route::get('/type/{type}', [DeductionController::class, 'getByType']);
        Route::get('/tax', [DeductionController::class, 'getTax']);
        Route::get('/pension', [DeductionController::class, 'getPension']);
        Route::get('/loans', [DeductionController::class, 'getLoans']);
        Route::get('/advances', [DeductionController::class, 'getAdvances']);
        Route::post('/', [DeductionController::class, 'store']);
        Route::get('/{deduction}', [DeductionController::class, 'show']);
        Route::patch('/{deduction}', [DeductionController::class, 'update']);
        Route::delete('/{deduction}', [DeductionController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Payroll Reports Routes
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:Admin,Owner,Supervisor,Manager,HR Manager,Finance')
    ->prefix('payroll-reports')
    ->group(function () {
        Route::get('/summary', [PayrollReportController::class, 'getSummaryReport']);
        Route::get('/employee-cost', [PayrollReportController::class, 'getEmployeeCostAnalysis']);
        Route::get('/period-comparison', [PayrollReportController::class, 'getPeriodComparison']);
        Route::get('/department', [PayrollReportController::class, 'getDepartmentReport']);
        Route::get('/deductions', [PayrollReportController::class, 'getDeductionAnalysis']);
        Route::get('/payment-history/{id}', [PayrollReportController::class, 'getPaymentRecord']);
        Route::get('/payment-history', [PayrollReportController::class, 'getPaymentHistory']);
        Route::get('/comprehensive', [PayrollReportController::class, 'getComprehensiveReport']);
    });

    /*
    |--------------------------------------------------------------------------
    | QR Attendance Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('qr-attendance')
    ->group(function () {
        // Generate QR token (admin/manager only)
        Route::middleware('role:Admin,Owner,Supervisor,Manager')
        ->post('/generate-token', [QrAttendanceController::class, 'generateToken']);
        
        // Validate QR token (authenticated)
        Route::middleware('auth:sanctum')
        ->post('/validate-token', [QrAttendanceController::class, 'validateToken']);
        
        // Check-in/Check-out via QR (authenticated)
        Route::middleware('auth:sanctum')
        ->post('/check-in', [QrAttendanceController::class, 'checkIn']);
        Route::middleware('auth:sanctum')
        ->post('/check-out', [QrAttendanceController::class, 'checkOut']);
        
        // Get current status (authenticated)
        Route::middleware('auth:sanctum')
        ->get('/current-status', [QrAttendanceController::class, 'getCurrentStatus']);
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