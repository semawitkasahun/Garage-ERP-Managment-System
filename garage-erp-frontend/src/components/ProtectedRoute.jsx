import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

const DASHBOARD_BY_ROLE = {
  owner: '/owner/dashboard',
  admin: '/admin/dashboard',
  technician: '/technician/dashboard',
  customer: '/customer/dashboard',
  supervisor: '/hr/dashboard',
  hr: '/hr/dashboard',
  finance: '/finance/dashboard',
  manager: '/manager/dashboard',
  employee: '/dashboard',
};

export function ProtectedRoute({ allowedRoles }) {
  const { status, role } = useAuthStore();

  if (status === 'loading' || status === 'idle') return null;
  if (status !== 'authenticated') return <Navigate to="/login" replace />;
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoleLower = (role || '').toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRoleLower);
    if (!isAllowed) {
      return <Navigate to={DASHBOARD_BY_ROLE[userRoleLower] ?? '/login'} replace />;
    }
  }
  return <Outlet />;
}