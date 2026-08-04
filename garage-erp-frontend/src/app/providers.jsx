import React from 'react'; 
import { BrowserRouter } from 'react-router-dom'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
 
const queryClient = new QueryClient({ 
  defaultOptions: { 
    queries: { 
      refetchOnWindowFocus: false, 
      retry: 1, 
      staleTime: 5 * 60 * 1000, 
    }, 
  }, 
}); 
 
export function Providers({ children }) { 
  return ( 
    <QueryClientProvider client={queryClient}> 
      <BrowserRouter> 
        {children} 
      </BrowserRouter> 
    </QueryClientProvider> 
  ); 
} 
