// src/app/App.jsx
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ToastProvider } from '@/components/ui/Toast';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AuthGate({ children }) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    console.log('AuthGate: Fetching user...');
    fetchUser();
  }, [fetchUser]);

  console.log('AuthGate: Status:', status);
  console.log('AuthGate: User:', useAuthStore((s) => s.user));

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading authentication…
      </div>
    );
  }
  
  return children;
}

export function App() {
  console.log('App component rendering');
  console.log('Router configured:', router);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Toaster richColors position="top-right" />
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
      </ToastProvider>
    </QueryClientProvider>
  );
}