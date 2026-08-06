import {
  LayoutDashboard, CalendarDays, ClipboardCheck, Users, UserPlus,
  Car, FileText, Wrench, ShieldCheck, Package, Truck, ShoppingCart,
  Receipt, CreditCard, Landmark, UserCog, KeyRound, Boxes, BarChart3,
  Settings,
} from 'lucide-react';

export function getNavSections(role) {
  const dashboardPath =
    role === 'owner' ? '/owner/dashboard' :
    role === 'admin' ? '/admin/dashboard' :
    role === 'supervisor' ? '/supervisor/dashboard' :
    role === 'technician' ? '/technician/dashboard' :
    role === 'finance' ? '/finance/dashboard' :
    role === 'hr' ? '/hr/dashboard' : '/dashboard';

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
        { label: 'Check-In', icon: ClipboardCheck, path: '/checkins/new' },
        { label: 'Customers', icon: Users, path: '/customers' },
        { label: 'Leads Management', icon: UserPlus, disabled: true },
      ],
    },
    {
      label: 'Service',
      items: [
        { label: 'Vehicles', icon: Car, disabled: true },
        { label: 'Quotations', icon: FileText, disabled: true },
        { label: 'Work Orders', icon: Wrench, disabled: true },
        { label: 'Quality Control', icon: ShieldCheck, disabled: true },
      ],
    },
    {
      label: 'Inventory & Supply',
      items: [
        { label: 'Inventory', icon: Package, disabled: true },
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
        { label: 'Employees', icon: UserCog, disabled: true },
        { label: 'Users & Roles', icon: KeyRound, disabled: true },
        { label: 'Attendance & Shifts', icon: KeyRound, disabled: true },
        { label: 'Leave Management', icon: KeyRound, disabled: true },
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
