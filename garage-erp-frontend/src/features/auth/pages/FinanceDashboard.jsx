import { useAuthStore } from '@/features/auth/store/authStore';

export function FinanceDashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-1">
            Finance
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
      <p className="text-sm text-muted-foreground">Finance dashboard content goes here.</p>
    </div>
  );
}