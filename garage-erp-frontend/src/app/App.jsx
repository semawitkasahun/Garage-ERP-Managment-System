// src/app/App.jsx
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ToastProvider } from '@/components/ui/Toast';

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
    fetchUser();
  }, [fetchUser]);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  return children;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthGate>
          <RouterProvider router={router} />
        </AuthGate>
      </ToastProvider>
    </QueryClientProvider>
  );
}