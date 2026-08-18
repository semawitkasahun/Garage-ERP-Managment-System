import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Car, Crown, Wrench, UserCog, User, ClipboardList, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/features/auth/store/authStore';
import carImage from '@/assets/car.png';

// Update these to match real seeded users in your DB for one-click testing
const QUICK_LOGINS = {
  owner:      { email: 'owner@garage.com',      password: 'password123' },
  admin:      { email: 'admin@garage.com',      password: 'password123' },
  supervisor: { email: 'supervisor@garage.com', password: 'password123' },
  finance:    { email: 'finance@garage.com',    password: 'password123' },
  hrmanager:  { email: 'hrmanager@garage.com',  password: 'password123' },
  technician: { email: 'technician@garage.com', password: 'password123' },
  customer:   { email: 'customer@garage.com',   password: 'password123' },
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    console.log('handleSubmit fired'); // temporary debug line
    try {
      const data = await login({ email, password });
      navigate(data.redirect ?? '/dashboard', { replace: true });
    } catch {
      // error already in the store, rendered below
    }
  }

  async function handleQuickLogin(role) {
    const creds = QUICK_LOGINS[role];
    setEmail(creds.email);
    setPassword(creds.password);
    try {
      const data = await login(creds);
      navigate(data.redirect ?? '/dashboard', { replace: true });
    } catch {
      // error already in the store, rendered below
    }
  }

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1.15fr_1fr] bg-background">
      {/* Left panel — dark, moody brand side */}
      <div
        className="relative hidden lg:flex flex-col justify-between overflow-hidden px-14 py-12"
        style={{
          background:
            'linear-gradient(160deg, hsl(90 14% 7%) 0%, hsl(84 12% 11%) 55%, hsl(90 14% 6%) 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-24 top-1/3 h-[420px] w-[420px]"
          style={{
            backgroundImage: `url(${carImage})`,
            backgroundSize: 'cover',
            backgroundPosition: '65% 45%',
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 72%)',
            opacity: 0.9,
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 20% 80%, hsl(84 20% 25% / 0.35), transparent 60%), radial-gradient(ellipse 50% 35% at 80% 20%, hsl(84 15% 20% / 0.3), transparent 60%)',
          }}
        />

        <svg
          className="pointer-events-none absolute -right-24 top-1/3 opacity-70"
          width="420"
          height="420"
          viewBox="0 0 420 420"
        >
          <circle cx="210" cy="210" r="150" fill="none" stroke="hsl(84 35% 45% / 0.25)" strokeWidth="1.5" />
          <circle cx="210" cy="210" r="150" fill="none" stroke="hsl(84 45% 55% / 0.5)" strokeWidth="2" strokeDasharray="6 14" />
          <circle cx="210" cy="210" r="105" fill="none" stroke="hsl(84 45% 55% / 0.35)" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md" style={{ background: 'hsl(84 25% 30%)' }}>
            <Car className="h-5 w-5" style={{ color: 'hsl(45 30% 95%)' }} />
          </div>
          <span className="font-display text-lg tracking-tight" style={{ color: 'hsl(45 30% 95%)' }}>
            Garage ERP
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-mono text-xs tracking-[0.2em] uppercase mb-4" style={{ color: 'hsl(84 30% 60%)' }}>
            Workshop management
          </p>
          <h1 className="font-display text-4xl leading-[1.1] tracking-tight mb-4" style={{ color: 'hsl(45 30% 96%)' }}>
            Run your entire garage<br />from one powerful dashboard.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'hsl(84 10% 65%)' }}>
            Manage vehicles, customers, technicians, repairs, inventory, and payments in one integrated system. Keep every service job organized from check-in to completion.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 font-mono text-[11px] tracking-wide" style={{ color: 'hsl(84 10% 50%)' }}>
          <span>© 2026 Garage ERP</span>
          <span>All rights reserved</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md" style={{ background: 'hsl(84 25% 30%)' }}>
              <Car className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-base font-semibold">Garage ERP</span>
          </div>

          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground mb-1.5">
            Welcome back
          </h2>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your account to continue</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="owner@garage.com"
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground">
                  Password
                </Label>
                <a href="#" className="text-xs font-medium hover:underline" style={{ color: 'hsl(84 30% 32%)' }}>
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button 
            type="submit"
            className="w-full"
          style={{ background: 'hsl(84 25% 30%)' }}
          disabled={status === 'loading'}
          onClick={() => alert('real button clicked')}>
            {status === 'loading' ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-8 border-t border-border pt-6">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-3">
              Quick login — development
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Owner',      icon: Crown,         role: 'owner' },
                { label: 'Admin',      icon: UserCog,       role: 'admin' },
                { label: 'Supervisor', icon: ClipboardList, role: 'supervisor' },
                { label: 'Finance',    icon: DollarSign,    role: 'finance' },
                { label: 'HR Manager', icon: Users,         role: 'hrmanager' },
                { label: 'Technician', icon: Wrench,        role: 'technician' },
                { label: 'Customer',   icon: User,          role: 'customer' },
              ].map(({ label, icon: Icon, role }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleQuickLogin(role)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}