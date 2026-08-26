import {
  LayoutDashboard, CalendarDays, ClipboardCheck, Users, UserPlus,
  Car, FileText, Wrench, ShieldCheck, Package, Truck, ShoppingCart,
  Receipt, CreditCard, Landmark, UserCog, KeyRound, Boxes, BarChart3,
  Settings, Clock, Calendar, CalendarClock, DollarSign, History as HistoryIcon
} from 'lucide-react';

export function getNavSections(role) {
  const dashboardPath =
    role === 'owner' ? '/owner/dashboard' :
      role === 'admin' ? '/admin/dashboard' :
        role === 'supervisor' ? '/supervisor/dashboard' :
          role === 'technician' ? '/technician/dashboard' :
            role === 'finance' ? '/finance/dashboard' :
              role === 'hr' ? '/hr/dashboard' : '/dashboard';

  const roleLower = (role || '').toLowerCase();
  const canManageEmployees = ['hr', 'hr manager', 'admin', 'owner', 'supervisor', 'manager', 'finance'].includes(roleLower);

  return [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: dashboardPath },
      ],
    },
    {
      label: 'Front Desk',
      items: [
        { label: 'Appointments', icon: CalendarDays, path: '/appointments' },
        { label: 'Check-In', icon: ClipboardCheck, path: '/checkins' },
        { label: 'Customers', icon: Users, path: '/customers' },
        { label: 'Leads Management', icon: UserPlus, disabled: true },
      ],
    },
    {
      label: 'Service',
      items: [
        { label: 'Vehicles', icon: Car, disabled: true },
        { label: 'Quotations', icon: FileText, path: '/quotations/new' },
        { label: 'Work Orders', icon: Wrench, path: '/work-orders' },
        { label: 'Quality Control', icon: ShieldCheck, disabled: true },
      ],
    },
    {
      label: 'Inventory & Supply',
      items: [
        { label: 'Equipment Registry', icon: Wrench, path: '/inventory/equipment' },
        { label: 'Inventory Dashboard', icon: LayoutDashboard, path: '/inventory' },
        { label: 'Parts & Stock', icon: Package, path: '/parts-stock' },
        { label: 'Check-Out / In Tracker', icon: Boxes, path: '/equipment/tracker' },
        { label: 'Equipment QR Labels', icon: Boxes, path: '/equipment/qr-labels' },
        { label: 'Suppliers', icon: Truck, disabled: true },
        { label: 'Purchasing', icon: ShoppingCart, disabled: true },
        { label: 'Sales', icon: Receipt, disabled: true },
      ],
    },
    {
      label: 'Finance',
      items: [
        { label: 'Billing & Payments', icon: CreditCard, disabled: true },
        { label: 'Financial Management', icon: Landmark, disabled: true },
      ],
    },
    {
      label: 'Human Resource Management',
      items: [
        { label: 'Employees', icon: UserCog, path: '/employees', disabled: !canManageEmployees },
        { label: 'Users & Roles', icon: KeyRound, disabled: true },
        { label: 'Attendance & Shifts', icon: Clock, path: '/attendance', disabled: !canManageEmployees },
        { label: 'Leave Management', icon: Calendar, path: '/leave', disabled: !canManageEmployees },
        { label: 'Payroll Management', icon: DollarSign, path: '/payroll', disabled: !canManageEmployees },
        { label: 'Payroll History', icon: HistoryIcon, path: '/payroll-history', disabled: !canManageEmployees },
        { label: 'Payroll Reports', icon: BarChart3, path: '/payroll/reports', disabled: false },
      ],
    },
    {
      label: 'Other',
      items: [
        { label: 'Assets', icon: Boxes, disabled: true },
        { label: 'Reports', icon: BarChart3, disabled: true },
        { label: 'Settings', icon: Settings, disabled: true },
      ],
    },
  ];
}
