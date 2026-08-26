import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OwnerDashboard } from '@/features/auth/pages/OwnerDashboard';
import { AdminDashboard } from '@/features/auth/pages/AdminDashboard';
import { TechnicianDashboard } from '@/features/auth/pages/TechnicianDashboard';
import { CustomerDashboard } from '@/features/auth/pages/CustomerDashboard';
import { SupervisorDashboard } from '@/features/auth/pages/SupervisorDashboard';
import { FinanceDashboard } from '@/features/auth/pages/FinanceDashboard';
import { HRManagerDashboard } from '@/features/auth/pages/HRManagerDashboard';
import { GenericDashboard } from '@/features/auth/pages/GenericDashboard';
import { AppointmentsPage } from '@/features/appointments/pages/AppointmentsPage';
import { NewAppointmentPage } from '@/features/appointments/pages/NewAppointmentPage';
import { CheckinPage } from '@/features/checkins/pages/CheckinPage';
import { CheckinListPage } from '@/features/checkins/pages/CheckinListPage';
import { CustomersPage } from '@/features/customers/pages/CustomersPage';
import { CustomerDetailPage } from '@/features/customers/pages/CustomerDetailPage';
import { LeadsPage } from '@/features/leads/pages/LeadsPage';
import { LeadDetailPage } from '@/features/leads/pages/LeadDetailPage';
import { EmployeesPage } from '@/features/employees/pages/EmployeesPage';
import { AttendancePage } from '@/features/attendance/pages/AttendancePage';
import { ShiftsPage } from '@/features/attendance/pages/ShiftsPage';
import { AttendanceTerminal } from '@/features/attendance/pages/AttendanceTerminal';
import { AttendanceScan } from '@/features/attendance/pages/AttendanceScan';
import { LeaveDashboard } from '@/features/leave/pages/LeaveDashboard';
import { PayrollPage } from '@/features/payroll/pages/PayrollPage';
import { PayrollHistoryPage } from '@/features/payroll/pages/PayrollHistoryPage';
import { PaymentDetailsPage } from '@/features/payroll/pages/PaymentDetailsPage';
import { EmployeePayrollDetailPage } from '@/features/payroll/pages/EmployeePayrollDetailPage';
import { PayrollReportsPage } from '@/features/payroll/pages/PayrollReportsPage';
import { WorkOrderListPage } from '@/features/workorders/pages/WorkOrderListPage';
import { WorkOrderDetailPage } from '@/features/workorders/pages/WorkOrderDetailPage';
import { WorkOrderCreatePage } from '@/features/workorders/pages/WorkOrderCreatePage';
import { WorkOrderFromCheckinPage } from '@/features/workorders/pages/WorkOrderFromCheckinPage';
import { JobCardCreatePage } from '@/features/jobcards/pages/JobCardCreatePage';
import { QuotationGeneratePage } from '@/features/quotations/pages/QuotationGeneratePage';
import { InventoryDashboardPage } from '@/features/inventory/pages/InventoryDashboardPage';
import { PartsStockPage } from '@/features/inventory/pages/PartsStockPage';
import { EquipmentCheckoutPage } from '@/features/inventory/pages/EquipmentCheckoutPage';
import { EquipmentReturnPage } from '@/features/inventory/pages/EquipmentReturnPage';
import { EquipmentAccountabilityPage } from '@/features/inventory/pages/EquipmentAccountabilityPage';
import { EndOfShiftPage } from '@/features/inventory/pages/EndOfShiftPage';
import { SuppliersPage } from '@/features/inventory/pages/SuppliersPage';
import { EquipmentQrLabelsPage } from '@/features/inventory/pages/EquipmentQrLabelsPage';
import { EquipmentPage } from '@/features/inventory/pages/Equipment/EquipmentPage';
import { CheckInOutTrackerPage } from '@/features/inventory/pages/Equipment/CheckInOutTrackerPage';


export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },

  {
    element: <ProtectedRoute allowedRoles={['owner']} />,
    children: [{ path: '/owner/dashboard', element: <OwnerDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin', 'supervisor', 'manager', 'service_advisor', 'technician', 'employee']} />,
    children: [
      { path: '/inventory', element: <InventoryDashboardPage /> },
      { path: '/inventory/dashboard', element: <InventoryDashboardPage /> },
      { path: '/inventory/parts', element: <PartsStockPage /> },
      { path: '/inventory/equipment', element: <EquipmentPage /> },
      { path: '/equipment', element: <EquipmentPage /> },
      { path: '/equipment/dashboard', element: <EquipmentPage /> },
      { path: '/equipment/checkout', element: <EquipmentCheckoutPage /> },
      { path: '/equipment/assign', element: <EquipmentCheckoutPage /> },
      { path: '/equipment/return', element: <EquipmentReturnPage /> },
      { path: '/equipment/scan', element: <EquipmentReturnPage /> },
      { path: '/equipment/tracker', element: <CheckInOutTrackerPage /> },
      { path: '/equipment/accountability', element: <EquipmentAccountabilityPage /> },
      { path: '/equipment/qr-labels', element: <EquipmentQrLabelsPage /> },
      { path: '/equipment/end-of-shift', element: <EndOfShiftPage /> },
      { path: '/inventory/suppliers', element: <SuppliersPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin', 'supervisor', 'manager', 'service_advisor', 'technician', 'hr', 'finance', 'employee']} />, children: [
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/appointments/new', element: <NewAppointmentPage /> },
      { path: '/checkins', element: <CheckinListPage /> },
      { path: '/checkins/new', element: <CheckinPage /> },
      { path: '/customers', element: <CustomersPage /> },
      { path: '/customers/:id', element: <CustomerDetailPage /> },
      { path: '/parts-stock', element: <PartsStockPage /> },
      { path: '/work-orders', element: <WorkOrderListPage /> },
      { path: '/work-orders/from-checkin', element: <WorkOrderFromCheckinPage /> },
      { path: '/work-orders/new', element: <WorkOrderCreatePage /> },
      { path: '/work-orders/:id', element: <WorkOrderDetailPage /> },
      { path: '/work-orders/:id/job-cards/new', element: <JobCardCreatePage /> },
      { path: '/quotations/new', element: <QuotationGeneratePage /> },
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin', 'supervisor', 'manager', 'hr', 'finance', 'service_advisor']} />,
    children: [
      { path: '/employees', element: <EmployeesPage /> },
      { path: '/attendance', element: <AttendancePage /> },
      { path: '/shifts', element: <ShiftsPage /> },
      { path: '/attendance/terminal', element: <AttendanceTerminal /> },
      { path: '/leave', element: <LeaveDashboard /> },
      { path: '/payroll', element: <PayrollPage /> },
      { path: '/payroll/history', element: <PayrollHistoryPage /> },
      { path: '/payroll-history', element: <PayrollHistoryPage /> },
      { path: '/payroll-history/pending/:itemId', element: <PaymentDetailsPage /> },
      { path: '/payroll-history/:paymentId', element: <PaymentDetailsPage /> },
      { path: '/payrollhistory', element: <PayrollHistoryPage /> },
      { path: '/payroll/payments', element: <PayrollHistoryPage /> },
      { path: '/payroll/periods', element: <PayrollPage defaultSection="periods" /> },
      { path: '/payroll/employees', element: <PayrollPage defaultSection="employees" /> },
      { path: '/payroll/employee/:employeeId', element: <EmployeePayrollDetailPage /> },
      { path: '/payroll/reports', element: <PayrollReportsPage /> },
      { path: '/payroll-reports', element: <PayrollReportsPage /> },
    ]
  },
  // Public attendance scan route (with auth check inside component)
  { path: '/attendance/scan', element: <AttendanceScan /> },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [{ path: '/admin/dashboard', element: <AdminDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin', 'supervisor', 'manager', 'service_advisor']} />, children: [
      { path: '/leads', element: <LeadsPage /> },
      { path: '/leads/:leadId', element: <LeadDetailPage /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['supervisor', 'hr']} />,
    children: [
      { path: '/hr/dashboard', element: <SupervisorDashboard /> },
      { path: '/supervisor/dashboard', element: <SupervisorDashboard /> },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['finance']} />,
    children: [{ path: '/finance/dashboard', element: <FinanceDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['technician']} />,
    children: [{ path: '/technician/dashboard', element: <TechnicianDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['customer']} />,
    children: [{ path: '/customer/dashboard', element: <CustomerDashboard /> }],
  },
  {
    element: (
      <ProtectedRoute
        allowedRoles={['manager', 'service_advisor', 'viewer', 'employee']}
      />
    ),
    children: [
      { path: '/dashboard', element: <GenericDashboard /> },
      { path: '/manager/dashboard', element: <GenericDashboard /> },
      { path: '/service-advisor/dashboard', element: <GenericDashboard /> },
    ],
  },
]);