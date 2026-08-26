import { useAuthStore } from '@/features/auth/store/authStore';
import { useNavigate } from 'react-router-dom';

export function SupervisorDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: 'Equipment Management',
      description: 'Register equipment, generate QR codes, and track accountability',
      path: '/equipment',
      icon: '🔧',
      color: 'bg-sky-50 border-sky-200 text-sky-700'
    },
    {
      title: 'Equipment Tracker',
      description: 'Check-in/check-out equipment with QR scanning',
      path: '/equipment/tracker',
      icon: '📱',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    },
    {
      title: 'Inventory Dashboard',
      description: 'Manage parts, stock levels, and suppliers',
      path: '/inventory/dashboard',
      icon: '📦',
      color: 'bg-amber-50 border-amber-200 text-amber-700'
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage customer appointments',
      path: '/appointments',
      icon: '📅',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      title: 'Check-ins',
      description: 'Vehicle check-in and inspection workflow',
      path: '/checkins',
      icon: '🚗',
      color: 'bg-rose-50 border-rose-200 text-rose-700'
    },
    {
      title: 'Work Orders',
      description: 'Manage work orders and job cards',
      path: '/work-orders',
      icon: '📋',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-1">
            Supervisor Dashboard
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Welcome, {user?.username ?? user?.email}
          </h1>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Log out
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardCards.map((card) => (
            <button
              key={card.path}
              onClick={() => navigate(card.path)}
              className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${card.color}`}
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
              <p className="text-sm opacity-80">{card.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <p className="text-sm text-muted-foreground">
          Recent equipment checkouts, inventory movements, and appointment activity will appear here.
        </p>
      </div>
    </div>
  );
}