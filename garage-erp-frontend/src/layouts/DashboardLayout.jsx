import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Bell, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

export function DashboardLayout({ navSections = [], pageTitle, roleLabel, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const sections = Array.isArray(navSections) ? navSections : [];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0 overflow-y-auto transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        style={{ background: 'linear-gradient(180deg, hsl(90 14% 7%) 0%, hsl(84 12% 10%) 100%)' }}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ background: 'hsl(84 25% 30%)' }}>
              <span className="font-display text-sm font-bold" style={{ color: 'hsl(45 30% 95%)' }}>G</span>
            </div>
            <span className="font-display text-[15px] tracking-tight" style={{ color: 'hsl(45 30% 95%)' }}>
              Garage ERP
            </span>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: 'hsl(84 10% 65%)' }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-3 pb-6">
          {sections.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="px-3 mb-1.5 font-mono text-[10px] tracking-[0.14em] uppercase" style={{ color: 'hsl(84 15% 40%)' }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {(section.items ?? []).map((item) => {
                  const active = item.path
                    ? location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                    : false;
                  const Icon = item.icon;

                  if (item.disabled) {
                    return (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-md px-3 py-2 text-sm"
                        style={{ color: 'hsl(84 8% 38%)' }}
                      >
                        <span className="flex items-center gap-2.5">
                          {Icon && <Icon className="h-4 w-4 shrink-0" />}
                          {item.label}
                        </span>
                        <span
                          className="font-mono text-[9px] tracking-wide uppercase rounded px-1.5 py-0.5"
                          style={{ background: 'hsl(84 12% 16%)', color: 'hsl(84 15% 50%)' }}
                        >
                          Soon
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors"
                      style={{
                        background: active ? 'hsl(84 25% 30% / 0.35)' : 'transparent',
                        color: active ? 'hsl(45 30% 96%)' : 'hsl(84 8% 62%)',
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {Icon && <Icon className="h-4 w-4 shrink-0" />}
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search…"
                className="w-56 rounded-md border border-input bg-background py-1.5 pl-9 pr-3 text-sm outline-none"
              />
            </div>
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full" style={{ background: 'hsl(84 45% 45%)' }} />
            </button>
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: 'hsl(84 20% 89%)', color: 'hsl(84 25% 25%)' }}
              >
                {(user?.employee?.first_name?.[0] ?? user?.username?.[0] ?? 'U').toUpperCase()}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-sm font-medium leading-tight">{user?.employee?.first_name ?? user?.username}</p>
                <p className="text-xs text-muted-foreground leading-tight">{roleLabel}</p>
              </div>
              <button onClick={logout} className="ml-1 text-muted-foreground hover:text-destructive" title="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}