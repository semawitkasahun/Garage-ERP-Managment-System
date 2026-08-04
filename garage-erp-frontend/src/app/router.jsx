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

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },

  {
    element: <ProtectedRoute allowedRoles={['owner']} />,
    children: [{ path: '/owner/dashboard', element: <OwnerDashboard /> }],
  },
  {
    element: <ProtectedRoute allowedRoles={['owner', 'admin', 'supervisor', 'manager', 'service_advisor', 'technician']} />, children: [
      { path: '/appointments', element: <AppointmentsPage /> },
      { path: '/appointments/new', element: <NewAppointmentPage /> },
      { path: '/checkins/new', element: <CheckinPage /> },
    ]
  },
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [{ path: '/admin/dashboard', element: <AdminDashboard /> }],
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